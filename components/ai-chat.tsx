"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { useChatContext } from "@/components/chat-provider";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AiChat() {
  const { eventContext } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: eventContext
          ? `Hi! Ask me anything about "${eventContext.title}". I have the full event details.`
          : "Hi! I'm your UChicago Campus AI assistant. Ask me to find events or explain what's on campus this week."
      }
    ]);
  }, [eventContext?.id, eventContext?.title]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.filter((message) => message.role !== "assistant" || message !== messages[0]),
          eventContext: eventContext
            ? {
                title: eventContext.title,
                summary: eventContext.summary,
                description: eventContext.description,
                start_at: eventContext.start_at,
                end_at: eventContext.end_at,
                location_text: eventContext.location_text,
                categories: eventContext.categories,
                source_url: eventContext.source_url
              }
            : null
        })
      });

      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error ?? "Sorry, I encountered an error." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_10px_25px_rgba(47,111,237,0.4)] transition-transform hover:scale-105"
        aria-label="Ask AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen ? (
        <div className="fixed bottom-24 right-6 z-50 flex h-[450px] w-[350px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2 font-medium">
              <Bot className="h-5 w-5" />
              {eventContext ? "Event AI" : "Campus AI"}
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-md p-1 hover:bg-brand-500" aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4" role="log" aria-live="polite">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === "user"
                      ? "rounded-br-none bg-brand-600 text-white"
                      : "rounded-bl-none border border-slate-200 bg-white text-slate-700 shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-none border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce [animation-delay:0.2s]">.</span>
                  <span className="animate-bounce [animation-delay:0.4s]">.</span>
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={eventContext ? "Ask about this event..." : "Find events on campus..."}
              className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={isLoading}
              aria-label="Chat message"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
