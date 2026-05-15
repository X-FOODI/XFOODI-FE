"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import type { User } from "@/lib/services/authService";
import { GoogleLogin } from "@react-oauth/google";
import { App } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

export type GoogleIdentityButtonProps = {
  rememberMe: boolean;
  disabled?: boolean;
  onAuthenticated: (user: User) => void;
  /** Sign-in vs sign-up wording on the official Google button. */
  variant?: "signin" | "signup";
};

export function GoogleIdentityButton({
  rememberMe,
  disabled = false,
  onAuthenticated,
  variant = "signin",
}: GoogleIdentityButtonProps) {
  const { t } = useTranslation("auth");
  const { loginWithGoogle } = useAuth();
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);

  const rememberRef = useRef(rememberMe);
  const loginWithGoogleRef = useRef(loginWithGoogle);
  const onAuthenticatedRef = useRef(onAuthenticated);

  useEffect(() => {
    rememberRef.current = rememberMe;
  }, [rememberMe]);

  useEffect(() => {
    loginWithGoogleRef.current = loginWithGoogle;
  }, [loginWithGoogle]);

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
  }, [onAuthenticated]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      message.error(
        t("login_email_page.google_invalid_token") ||
          "Invalid Google response. Please try again."
      );
      return;
    }

    setBusy(true);
    try {
      const user = await loginWithGoogleRef.current(
        credential,
        rememberRef.current
      );
      onAuthenticatedRef.current(user);
    } catch (err: unknown) {
      const fallback =
        t("login_email_page.google_login_error") ||
        "Đăng nhập Google thất bại. Vui lòng thử lại.";
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message.trim()
          : fallback;
      message.error(msg);
      console.error("Google login error:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleError = () => {
    message.warning(
      t("login_email_page.google_popup_closed") ||
        "Google sign-in was cancelled or could not complete."
    );
  };

  const buttonText =
    variant === "signup" ? ("signup_with" as const) : ("continue_with" as const);

  const blocked = disabled || busy;

  return (
    <div
      className={`google-oauth-btn-wrap relative w-full flex justify-center min-h-[44px] items-center ${
        blocked ? "pointer-events-none" : ""
      }`}
      aria-busy={busy}
    >
      <div
        className={`w-full flex justify-center transition-opacity ${
          busy ? "opacity-40" : "opacity-100"
        }`}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          ux_mode="popup"
          theme="outline"
          size="large"
          shape="rectangular"
          text={buttonText}
          width={320}
          containerProps={{
            className:
              "w-full flex justify-center [&>div]:w-full [&>div]:max-w-[400px]",
          }}
        />
      </div>
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-md">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
