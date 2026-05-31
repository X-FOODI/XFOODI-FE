"use client";

import { GoogleIcon } from "@/components/auth/social/GoogleIcon";
import { socialAuthButtonClassName } from "@/components/auth/social/SocialAuthButton";
import { useAuth } from "@/lib/contexts/AuthContext";
import type { User } from "@/lib/services/authService";
import { App } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

export type GoogleIdentityButtonProps = {
  rememberMe: boolean;
  disabled?: boolean;
  onAuthenticated: (user: User) => void;
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

  // Listen to message events from the Google OAuth callback popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "GOOGLE_OAUTH_TOKEN") {
        const idToken = event.data.token;
        if (!idToken) return;

        setBusy(true);
        try {
          const user = await loginWithGoogleRef.current(
            idToken,
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
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [t, message]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  const handleGoogleClick = () => {
    if (disabled || busy) return;

    // Open Google OAuth popup window centered on the screen
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const nonce = Math.random().toString(36).substring(2);
    // Use window.location.origin so it matches the registered redirect URIs in Google Cloud Console
    const redirectUri = encodeURIComponent(window.location.origin);
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=id_token&scope=openid%20email%20profile&nonce=${nonce}`;

    window.open(
      googleUrl,
      "google-login-popup",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );
  };

  const label =
    variant === "signup"
      ? t("login_email_page.google_continue_service_signup") ||
        t("login_email_page.google_continue_service") ||
        "Tiếp tục đăng ký bằng Google"
      : t("login_email_page.google_continue_service") ||
        "Tiếp tục sử dụng dịch vụ bằng Google";

  const inactive = disabled || busy;

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={inactive}
      aria-busy={busy || undefined}
      className={`${socialAuthButtonClassName} cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {busy ? (
        <span
          className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800"
          aria-hidden
        />
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          <GoogleIcon />
        </span>
      )}
      <span className="social-auth-btn__label min-w-0 flex-1 truncate text-center text-sm font-semibold text-gray-800">
        {label}
      </span>
    </button>
  );
}
