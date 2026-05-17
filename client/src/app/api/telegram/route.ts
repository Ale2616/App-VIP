import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const chatId = body?.message?.chat?.id;
  const text = body?.message?.text;

  if (!chatId) {
    return NextResponse.json({ ok: true });
  }

  if (text === "/start") {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "¡Hola! Soy Mia, tu asistente en App VIP. 🚀 ¿En qué te puedo ayudar hoy?",
        }),
      }
    );
  }

  return NextResponse.json({ ok: true });
}
