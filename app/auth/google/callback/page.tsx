"use client";

import { useEffect } from "react";

/**
 * Google OAuth Popup Callback
 *
 * Google redirects the popup window here after the user authenticates.
 * The id_token is in the URL hash fragment (#id_token=...&token_type=Bearer...).
 * This page extracts the token and sends it to the opener via postMessage,
 * then closes the popup.
 *
 * redirect_uri registered in Google Cloud Console:
 *   http://localhost:3000/auth/google/callback   (dev)
 *   https://<your-domain>/auth/google/callback   (prod)
 */
export default function GoogleCallbackPage() {
  useEffect(() => {
    try {
      // The token lives in the hash fragment, e.g.:
      // #id_token=eyJ...&token_type=Bearer&expires_in=3599
      const hash = window.location.hash.substring(1); // remove leading '#'
      const params = new URLSearchParams(hash);
      const idToken = params.get("id_token");
      const error = params.get("error");

      if (window.opener && window.opener !== window) {
        if (idToken) {
          window.opener.postMessage(
            { type: "GOOGLE_OAUTH_TOKEN", token: idToken },
            window.location.origin
          );
        } else if (error) {
          window.opener.postMessage(
            { type: "GOOGLE_OAUTH_ERROR", error },
            window.location.origin
          );
        }
        // Close the popup — the opener will handle the token
        window.close();
      } else {
        // Fallback: not in a popup, redirect to login page
        window.location.href = "/login";
      }
    } catch {
      // Any error: redirect to login
      window.location.href = "/login";
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
        color: "#fff",
        fontFamily: "Inter, system-ui, sans-serif",
        gap: 16,
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.15)",
          borderTopColor: "#ff5722",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", margin: 0 }}>
        Đang hoàn tất đăng nhập Google…
      </p>
    </div>
  );
}
