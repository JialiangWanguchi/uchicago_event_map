"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import type { EventRecord } from "@/types/event";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AiChat({ event }: { event: EventRecord }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `Hi! I'm your AI assistant for "${event.title}". What would you like to know?` }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.slice(1), userMsg],
          eventContext: {
            title: event.title,
            description: event.description,
            time: `${event.start_at} to ${event.end_at || "TBD"}`,
            location: event.location_text || event.venue_name || "TBD",
            categories: event.categories,
          }
        }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }]);
      }
    } catch (err) {
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

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[450px] w-[350px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2 font-medium">
              <Bot className="h-5 w-5" />
              AI Assistant
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-md p-1 hover:bg-brand-500">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-brand-600 text-white rounded-br-none"
                      : "bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-none px-4 py-2 text-sm shadow-sm flex items-center gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this event..."
              className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
