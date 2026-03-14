import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebase";

// Required scopes for Google Calendar
const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

interface GoogleCalendarState {
  isAuthorized: boolean;
  isLoading: boolean;
  accessToken: string | null;
  error: string | null;
}

interface GoogleCalendarContextValue extends GoogleCalendarState {
  authorize: () => Promise<boolean>;
  refreshToken: () => Promise<string | null>;
  clearError: () => void;
}

const GoogleCalendarContext = createContext<GoogleCalendarContextValue | null>(
  null
);

export function GoogleCalendarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GoogleCalendarState>({
    isAuthorized: false,
    isLoading: true,
    accessToken: null,
    error: null,
  });

  // Check if user already has calendar access on mount
  useEffect(() => {
    const checkAccess = () => {
      const user = auth.currentUser;
      if (!user) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Try to get token from session storage (cached from previous auth)
      const cachedToken = sessionStorage.getItem("gcal_access_token");
      const tokenExpiry = sessionStorage.getItem("gcal_token_expiry");

      if (cachedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        setState({
          isAuthorized: true,
          isLoading: false,
          accessToken: cachedToken,
          error: null,
        });
        return;
      }

      // Clear expired token
      sessionStorage.removeItem("gcal_access_token");
      sessionStorage.removeItem("gcal_token_expiry");

      setState((prev) => ({ ...prev, isLoading: false }));
    };

    // Wait a bit for auth to be ready
    const timer = setTimeout(checkAccess, 500);
    return () => clearTimeout(timer);
  }, []);

  const authorize = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Create provider with calendar scopes
      const provider = new GoogleAuthProvider();
      CALENDAR_SCOPES.forEach((scope) => provider.addScope(scope));

      // Force consent to ensure user grants calendar access
      provider.setCustomParameters({
        prompt: "consent",
      });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error("No access token received");
      }

      // Cache token with 55 min expiry (tokens last 1 hour, refresh a bit early)
      const expiry = Date.now() + 55 * 60 * 1000;
      sessionStorage.setItem("gcal_access_token", credential.accessToken);
      sessionStorage.setItem("gcal_token_expiry", expiry.toString());

      setState({
        isAuthorized: true,
        isLoading: false,
        accessToken: credential.accessToken,
        error: null,
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authorization failed";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    // Re-authorize to get fresh token
    const success = await authorize();
    if (success) {
      return sessionStorage.getItem("gcal_access_token");
    }
    return null;
  }, [authorize]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <GoogleCalendarContext.Provider
      value={{ ...state, authorize, refreshToken, clearError }}
    >
      {children}
    </GoogleCalendarContext.Provider>
  );
}

export function useGoogleCalendarAuth() {
  const context = useContext(GoogleCalendarContext);
  if (!context) {
    throw new Error(
      "useGoogleCalendarAuth must be used within GoogleCalendarProvider"
    );
  }
  return context;
}
