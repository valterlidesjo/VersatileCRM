import { useMemo } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { AuthProvider, useAuth, type AuthState } from "./lib/auth";
import { PartnerProvider } from "./lib/partner";
import { GoogleCalendarProvider } from "./lib/google-calendar";
import "./index.css";

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
  interface RouterContext {
    auth: AuthState;
  }
}

function App() {
  const auth = useAuth();

  useMemo(() => {
    router.update({
      context: { auth },
    });
  }, [auth]);

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")!).render(
  // Note: StrictMode temporarily disabled due to known Firestore listener issues
  // See: https://github.com/firebase/firebase-js-sdk/issues/7689
  // <StrictMode>
    <AuthProvider>
      <PartnerProvider>
        <GoogleCalendarProvider>
          <App />
        </GoogleCalendarProvider>
      </PartnerProvider>
    </AuthProvider>
  // </StrictMode>
);
