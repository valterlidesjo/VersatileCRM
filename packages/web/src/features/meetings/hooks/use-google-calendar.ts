import { useCallback } from "react";
import { useGoogleCalendarAuth } from "@/lib/google-calendar";

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  htmlLink?: string;
  updated?: string;
}

interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  attendees?: Array<{ email: string; name?: string }>;
  sendNotifications?: boolean;
}

export function useGoogleCalendar() {
  const { accessToken, isAuthorized, authorize, refreshToken } =
    useGoogleCalendarAuth();

  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      let token = accessToken;

      if (!token) {
        token = await refreshToken();
        if (!token) throw new Error("Not authorized for Google Calendar");
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // If token expired, refresh and retry
      if (response.status === 401) {
        token = await refreshToken();
        if (!token) throw new Error("Token refresh failed");

        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      return response;
    },
    [accessToken, refreshToken]
  );

  const listEvents = useCallback(
    async (
      timeMin: string,
      timeMax: string,
      calendarId = "primary"
    ): Promise<GoogleCalendarEvent[]> => {
      const params = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      });

      const response = await fetchWithAuth(
        `${CALENDAR_API_BASE}/calendars/${calendarId}/events?${params}`
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error?.message || `Failed to fetch events: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.items || [];
    },
    [fetchWithAuth]
  );

  const createEvent = useCallback(
    async (
      input: CreateEventInput,
      calendarId = "primary"
    ): Promise<GoogleCalendarEvent> => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const event: GoogleCalendarEvent = {
        summary: input.title,
        description: input.description,
        location: input.location,
        start: input.allDay
          ? { date: input.startTime.split("T")[0] }
          : { dateTime: input.startTime, timeZone },
        end: input.allDay
          ? { date: input.endTime.split("T")[0] }
          : { dateTime: input.endTime, timeZone },
        attendees: input.attendees?.map((a) => ({
          email: a.email,
          displayName: a.name,
        })),
      };

      const sendUpdates = input.sendNotifications !== false ? "all" : "none";

      const response = await fetchWithAuth(
        `${CALENDAR_API_BASE}/calendars/${calendarId}/events?sendUpdates=${sendUpdates}`,
        {
          method: "POST",
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error?.message || `Failed to create event: ${response.statusText}`
        );
      }

      return response.json();
    },
    [fetchWithAuth]
  );

  const updateEvent = useCallback(
    async (
      eventId: string,
      input: Partial<CreateEventInput>,
      calendarId = "primary",
      sendNotifications = true
    ): Promise<GoogleCalendarEvent> => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const event: Partial<GoogleCalendarEvent> = {};

      if (input.title) event.summary = input.title;
      if (input.description !== undefined) event.description = input.description;
      if (input.location !== undefined) event.location = input.location;

      if (input.startTime) {
        event.start = input.allDay
          ? { date: input.startTime.split("T")[0] }
          : { dateTime: input.startTime, timeZone };
      }
      if (input.endTime) {
        event.end = input.allDay
          ? { date: input.endTime.split("T")[0] }
          : { dateTime: input.endTime, timeZone };
      }
      if (input.attendees) {
        event.attendees = input.attendees.map((a) => ({
          email: a.email,
          displayName: a.name,
        }));
      }

      const sendUpdates = sendNotifications ? "all" : "none";

      const response = await fetchWithAuth(
        `${CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}?sendUpdates=${sendUpdates}`,
        {
          method: "PATCH",
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error?.message || `Failed to update event: ${response.statusText}`
        );
      }

      return response.json();
    },
    [fetchWithAuth]
  );

  const deleteEvent = useCallback(
    async (
      eventId: string,
      calendarId = "primary",
      sendNotifications = true
    ): Promise<void> => {
      const sendUpdates = sendNotifications ? "all" : "none";

      const response = await fetchWithAuth(
        `${CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}?sendUpdates=${sendUpdates}`,
        { method: "DELETE" }
      );

      // 404 means already deleted, which is fine
      if (!response.ok && response.status !== 404) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error?.message || `Failed to delete event: ${response.statusText}`
        );
      }
    },
    [fetchWithAuth]
  );

  return {
    isAuthorized,
    authorize,
    listEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
