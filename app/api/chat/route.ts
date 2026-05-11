import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  try {
    const { messages, eventContext } = await req.json();

    const systemMessage = {
      role: "system",
      content: `You are an AI assistant for a UChicago campus event. Here are the event details:\n${JSON.stringify(eventContext)}\n\nAnswer the user's questions about this event concisely and helpfully. Keep answers short (1-3 sentences) unless asked for more details. If you don't know something based on the context, say you don't know but suggest they check the original listing.`,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages],
    });

    return NextResponse.json({ message: response.choices[0].message });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
