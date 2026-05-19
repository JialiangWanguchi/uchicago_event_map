"use client";

import { useEffect } from "react";
import { useChatContext } from "@/components/chat-provider";
import type { EventRecord } from "@/types/event";

export function DetailChatContext({ event }: { event: EventRecord }) {
  const { setEventContext } = useChatContext();

  useEffect(() => {
    setEventContext(event);
    return () => setEventContext(null);
  }, [event, setEventContext]);

  return null;
}
