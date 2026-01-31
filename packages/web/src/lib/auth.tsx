import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "denied"; email: string }
  | { status: "authenticated"; user: User };

const AuthContext = createContext<AuthState>({ status: "loading" });

const googleProvider = new GoogleAuthProvider();

// Module-level state to survive the onAuthStateChanged re-fire after sign-out
let deniedEmail: string | null = null;

async function isEmailAllowed(email: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "allowedEmails", email));
  return snap.exists();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user?.email) {
        setState(
          deniedEmail
            ? { status: "denied", email: deniedEmail }
            : { status: "unauthenticated" },
        );
        return;
      }

      const allowed = await isEmailAllowed(user.email);
      if (!allowed) {
        deniedEmail = user.email;
        await firebaseSignOut(auth);
        return;
      }

      deniedEmail = null;
      setState({ status: "authenticated", user });
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function signIn() {
  await signInWithPopup(auth, googleProvider);
}

export async function signOut() {
  deniedEmail = null;
  await firebaseSignOut(auth);
}
