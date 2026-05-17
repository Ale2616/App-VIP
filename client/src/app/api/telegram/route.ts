import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body?.message;

    if (!message || !message.chat || !message.chat.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    let textToSend = "";

    if (message.new_chat_members && message.new_chat_members.length > 0) {
      const names = message.new_chat_members.map((m: any) => m.first_name).join(", ");
      textToSend = `¡Hola ${names}! 👋 Bienvenidos a la comunidad VIP. Soy Mia, la asistente del grupo. Si gustas pedir una aplicación o aportar alguna sugerencia, puedes hacerlo libremente por aquí. ¡Disfruta del contenido! 🚀`;
    } else if (message.text) {
      const text = message.text.toLowerCase();
      if (text === '/start') {
        textToSend = "¡Hola! Soy Mia, tu asistente en App VIP. 🚀 ¿En qué te puedo ayudar hoy?";
      } else if (text.includes('mia') || text.includes('mía')) {
        textToSend = "¡Hola! Escuché mi nombre. 🙋♀️ Soy Mia, tu asistente virtual. ¿En qué te puedo ayudar hoy? Puedes pedirme aplicaciones o juegos y el equipo los subirá pronto.";
      } else if (text.includes('juego') || text.includes('aplicación') || text.includes('mod') || text.includes('app') || text.includes('apps')) {
         textToSend = "Si estás buscando algo en específico, deja el nombre aquí y estaremos revisando para subirlo a la plataforma VIP. ✨";
      }
    }

    if (textToSend !== "") {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: textToSend,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error Telegram Webhook:", error);
    return NextResponse.json({ ok: true });
  }
}
