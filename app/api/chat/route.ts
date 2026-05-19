import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { searchEventsSemantic } from "@/lib/data";
import { checkRateLimit } from "@/lib/rate-limit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  const { userId } = await auth();
  const rateKey = userId ?? req.headers.get("x-forwarded-for") ?? "anonymous";
  const limit = checkRateLimit(`chat:${rateKey}`, 20, 60_000);

  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  try {
    const { messages, eventContext } = await req.json();
    const lastUserMessage = [...messages].reverse().find((message: { role: string }) => message.role === "user");

    let eventDiscoveryContext = "";
    if (!eventContext && lastUserMessage?.content) {
      const matches = await searchEventsSemantic(String(lastUserMessage.content), 5);
      if (matches.length > 0) {
        eventDiscoveryContext = `\nRelevant upcoming events:\n${JSON.stringify(matches, null, 2)}`;
      }
    }

    const systemMessage = {
      role: "system",
      content: eventContext
        ? `You are an AI assistant for a UChicago campus event. Here are the event details:\n${JSON.stringify(eventContext)}\n\nAnswer the user's questions about this event concisely and helpfully. Keep answers short (1-3 sentences) unless asked for more details. If you don't know something based on the context, say you don't know but suggest they check the original listing.`
        : `You are an AI assistant for the UChicago Campus Event Map application. Help the user discover campus events and explain how to use the app. Use the relevant events list when answering discovery questions.${eventDiscoveryContext}\n\nKeep answers concise (1-3 sentences).`,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages]
    });

    return NextResponse.json({ message: response.choices[0].message });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
