"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { ReactNode } from "react";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

/**
 * Wraps the tree with {@link GoogleOAuthProvider} when a Web client ID is configured.
 * Required for {@link GoogleLogin} / Google button flows from `@react-oauth/google`.
 */
export function GoogleOAuthAppProvider({ children }: { children: ReactNode }) {
  if (!clientId) {
    return <>{children}</>;
  }
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
