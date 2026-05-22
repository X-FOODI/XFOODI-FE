"use client";

import { GoogleIcon } from "@/components/auth/social/GoogleIcon";
import { socialAuthButtonClassName } from "@/components/auth/social/SocialAuthButton";
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
  const [buttonWidth, setButtonWidth] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) setButtonWidth(w);
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      message.error(
        t("login_email_page.google_invalid_token") ||
          "Phản hồi Google không hợp lệ. Vui lòng thử lại."
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
        "Đã hủy đăng nhập Google hoặc không thể hoàn tất."
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
    <div
      ref={containerRef}
      className="google-oauth-btn-wrap relative w-full h-12 min-h-[3rem]"
      aria-busy={busy || undefined}
      aria-disabled={inactive || undefined}
    >
      <div
        className={`${socialAuthButtonClassName} relative z-[1] pointer-events-none select-none`}
        aria-hidden
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
        <span className="social-auth-btn__label min-w-0 flex-1 truncate text-center text-sm font-medium text-gray-800">
          {label}
        </span>
      </div>

      {!inactive && (
        <div
          className="absolute inset-0 z-[2] overflow-hidden rounded-xl opacity-0 cursor-pointer [&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-12 [&_iframe]:!min-h-[3rem] [&_iframe]:!w-full"
          aria-label={label}
        >
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            ux_mode="popup"
            theme="outline"
            size="large"
            shape="rectangular"
            text="continue_with"
            width={buttonWidth}
            containerProps={{
              className: "h-full w-full flex items-stretch justify-stretch",
              style: { height: "100%", width: "100%" },
            }}
          />
        </div>
      )}
    </div>
  );
}
