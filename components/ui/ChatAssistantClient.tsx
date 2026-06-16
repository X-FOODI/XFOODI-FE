"use client";

import dynamic from "next/dynamic";

// Load ChatAssistant only on client side (no SSR) to prevent hydration mismatch.
// ChatAssistant reads window/localStorage which are unavailable on the server.
const ChatAssistant = dynamic(
  () => import("@/components/ui/ChatAssistant").then(m => ({ default: m.ChatAssistant })),
  { ssr: false }
);

export function ChatAssistantClient() {
  return <ChatAssistant />;
}
