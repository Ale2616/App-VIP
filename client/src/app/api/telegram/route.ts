import { NextResponse } from "next/server";

async function sendMessage(chatId: number | string, text: string) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    }
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const message = body?.message;

  if (!message) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message?.chat?.id;

  if (!chatId) {
    return NextResponse.json({ ok: true });
  }

  // ── 1. Nuevos miembros ──────────────────────────────────────────────────────
  if (
    Array.isArray(message.new_chat_members) &&
    message.new_chat_members.length > 0
  ) {
    const names = message.new_chat_members
      .map((m: { first_name?: string }) => m.first_name || "amigo")
      .join(", ");

    await sendMessage(
      chatId,
      `¡Hola ${names}! 👋 Bienvenidos a la comunidad VIP. Soy Mia, la asistente del grupo. Si gustas pedir una aplicación o aportar alguna sugerencia, puedes hacerlo libremente por aquí. ¡Disfruta del contenido! 🚀`
    );

    return NextResponse.json({ ok: true });
  }

  // ── 2. Mensajes de texto ────────────────────────────────────────────────────
  if (message.text) {
    const lower: string = message.text.toLowerCase();
    let reply: string | null = null;

    if (lower === "/start") {
      reply =
        "¡Hola! Soy Mia, tu asistente en App VIP. 🚀 ¿En qué te puedo ayudar hoy?";
    } else if (lower.includes("mia") || lower.includes("mía")) {
      reply =
        "¡Hola! Escuché mi nombre. 🙋‍♀️ Soy Mia, tu asistente virtual. ¿En qué te puedo ayudar hoy? Puedes pedirme aplicaciones o juegos y el equipo los subirá pronto.";
    } else if (
      lower.includes("juego") ||
      lower.includes("aplicación") ||
      lower.includes("mod") ||
      lower.includes("app")
    ) {
      reply =
        "Si estás buscando algo en específico, deja el nombre aquí y estaremos revisando para subirlo a la plataforma VIP. ✨";
    }

    if (reply) {
      await sendMessage(chatId, reply);
    }
  }

  return NextResponse.json({ ok: true });
}
