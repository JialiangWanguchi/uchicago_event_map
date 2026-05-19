"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { EventRecord } from "@/types/event";

type ChatContextValue = {
  eventContext: EventRecord | null;
  setEventContext: (event: EventRecord | null) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [eventContext, setEventContext] = useState<EventRecord | null>(null);
  const value = useMemo(() => ({ eventContext, setEventContext }), [eventContext]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}
