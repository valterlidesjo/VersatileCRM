import { useState, useEffect, useCallback, useRef } from "react";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
} from "firebase/firestore";
import { partnerCol, partnerDocRef } from "@/lib/firebase-partner";
import { usePartner } from "@/lib/partner";
import type { Meeting } from "@crm/shared";
import { useGoogleCalendar } from "./use-google-calendar";
import {
  googleEventToMeeting,
  needsSync,
  emptySyncResult,
  type SyncResult,
} from "../utils/meeting-sync";

export interface MeetingFormData {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  attendees: Array<{ email: string; name?: string }>;
  customerId?: string;
  dealId?: string;
  contactId?: string;
  notes?: string;
  sendNotifications: boolean;
}

export function useMeetings() {
  const { partnerId } = usePartner();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const isSubscribedRef = useRef(false);

  const { isAuthorized, listEvents, createEvent, updateEvent, deleteEvent } =
    useGoogleCalendar();

  // Subscribe to Firestore meetings
  useEffect(() => {
    // Prevent double-subscription in StrictMode
    if (isSubscribedRef.current) {
      return;
    }

    isSubscribedRef.current = true;

    const q = query(partnerCol(partnerId, "meetings"), orderBy("startTime", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Meeting[];
      setMeetings(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, [partnerId]);

  // Sync Google Calendar events to Firestore
  const syncFromGoogleCalendar = useCallback(
    async (startDate?: Date, endDate?: Date): Promise<SyncResult> => {
      if (!isAuthorized) {
        return emptySyncResult();
      }

      setSyncing(true);
      const result = emptySyncResult();

      try {
        // Default to 1 month back and 3 months forward
        const now = new Date();
        const timeMin = (
          startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        ).toISOString();
        const timeMax = (
          endDate || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
        ).toISOString();

        const events = await listEvents(timeMin, timeMax);

        // Get existing meetings with Google Calendar IDs
        const existingMeetingsQuery = query(
          partnerCol(partnerId, "meetings"),
          where("googleCalendarEventId", "!=", null)
        );
        const existingDocs = await getDocs(existingMeetingsQuery);
        const existingByEventId = new Map<string, Meeting & { docId: string }>();

        existingDocs.forEach((docSnap) => {
          const meeting = { id: docSnap.id, ...docSnap.data() } as Meeting;
          if (meeting.googleCalendarEventId) {
            existingByEventId.set(meeting.googleCalendarEventId, {
              ...meeting,
              docId: docSnap.id,
            });
          }
        });

        // Process each Google Calendar event
        for (const event of events) {
          if (!event.id) continue;

          try {
            const existing = existingByEventId.get(event.id);

            if (!needsSync(event, existing)) {
              result.unchanged.push(event.id);
              continue;
            }

            const meetingData = googleEventToMeeting(event, existing);
            const nowStr = new Date().toISOString();

            if (existing) {
              await updateDoc(partnerDocRef(partnerId, "meetings", existing.docId), {
                ...meetingData,
                updatedAt: nowStr,
              });
              result.updated.push(event.id);
            } else {
              await addDoc(partnerCol(partnerId, "meetings"), {
                ...meetingData,
                createdAt: nowStr,
                updatedAt: nowStr,
              });
              result.created.push(event.id);
            }
          } catch (error) {
            result.errors.push({
              eventId: event.id,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      } finally {
        setSyncing(false);
      }

      return result;
    },
    [isAuthorized, listEvents, partnerId]
  );

  // Create meeting (Firestore + Google Calendar)
  const addMeeting = useCallback(
    async (data: MeetingFormData): Promise<string> => {
      const now = new Date().toISOString();
      let googleCalendarEventId: string | undefined;
      let googleCalendarLink: string | undefined;

      // Create Google Calendar event first (if authorized)
      if (isAuthorized) {
        try {
          const gcalEvent = await createEvent({
            title: data.title,
            description: data.description,
            location: data.location,
            startTime: data.startTime,
            endTime: data.endTime,
            allDay: data.allDay,
            attendees: data.attendees,
            sendNotifications: data.sendNotifications,
          });
          googleCalendarEventId = gcalEvent.id;
          googleCalendarLink = gcalEvent.htmlLink;
        } catch (error) {
          console.error("Failed to create Google Calendar event:", error);
          // Continue with Firestore creation even if GCal fails
        }
      }

      // Create Firestore document
      const docRef = await addDoc(partnerCol(partnerId, "meetings"), {
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        startTime: data.startTime,
        endTime: data.endTime,
        allDay: data.allDay,
        attendees: data.attendees,
        customerId: data.customerId || null,
        dealId: data.dealId || null,
        contactId: data.contactId || null,
        notes: data.notes || null,
        sendNotifications: data.sendNotifications,
        googleCalendarEventId: googleCalendarEventId || null,
        googleCalendarLink: googleCalendarLink || null,
        syncedAt: googleCalendarEventId ? now : null,
        createdAt: now,
        updatedAt: now,
      });

      return docRef.id;
    },
    [isAuthorized, createEvent, partnerId]
  );

  // Update meeting
  const updateMeeting = useCallback(
    async (id: string, data: Partial<MeetingFormData>): Promise<void> => {
      const now = new Date().toISOString();

      // Find existing meeting for Google Calendar ID
      const existingMeeting = meetings.find((m) => m.id === id);

      // Update Google Calendar event if linked
      if (isAuthorized && existingMeeting?.googleCalendarEventId) {
        try {
          await updateEvent(
            existingMeeting.googleCalendarEventId,
            {
              title: data.title,
              description: data.description,
              location: data.location,
              startTime: data.startTime,
              endTime: data.endTime,
              allDay: data.allDay,
              attendees: data.attendees,
            },
            "primary",
            data.sendNotifications ?? true
          );
        } catch (error) {
          console.error("Failed to update Google Calendar event:", error);
        }
      }

      // Update Firestore
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: now,
      };

      // Update syncedAt if this meeting is linked to Google Calendar
      if (existingMeeting?.googleCalendarEventId) {
        updateData.syncedAt = now;
      }

      await updateDoc(partnerDocRef(partnerId, "meetings", id), updateData);
    },
    [isAuthorized, updateEvent, meetings, partnerId]
  );

  // Delete meeting
  const deleteMeeting = useCallback(
    async (id: string): Promise<void> => {
      const meeting = meetings.find((m) => m.id === id);

      // Delete from Google Calendar if linked
      if (isAuthorized && meeting?.googleCalendarEventId) {
        try {
          await deleteEvent(meeting.googleCalendarEventId);
        } catch (error) {
          console.error("Failed to delete Google Calendar event:", error);
        }
      }

      // Delete from Firestore
      await deleteDoc(partnerDocRef(partnerId, "meetings", id));
    },
    [isAuthorized, deleteEvent, meetings, partnerId]
  );

  return {
    meetings,
    loading,
    syncing,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    syncFromGoogleCalendar,
  };
}
