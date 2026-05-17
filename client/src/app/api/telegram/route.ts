import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    } 
    else if (message.text) {
      const text = message.text.toLowerCase().trim();

      if (text === '/start') {
        textToSend = "¡Hola! Soy Mia, tu asistente en App VIP. 🚀 ¿En qué te puedo ayudar hoy?";
      } 
      else if (text.includes('busca') || text.includes('búscame') || text.includes('pásame') || text.includes('quiero') || text.startsWith('/buscar')) {
        let query = text
          .replace('mia', '')
          .replace('mía', '')
          .replace('búscame', '')
          .replace('busca', '')
          .replace('pásame', '')
          .replace('quiero', '')
          .replace('/buscar', '')
          .trim();

        if (query.length > 0) {
          // CORRECCIÓN: Buscando en la tabla 'applications' y columna 'name'
          const { data: apps, error } = await supabase
            .from('applications')
            .select('name, slug')
            .ilike('name', `%${query}%`)
            .limit(3);

          if (apps && apps.length > 0) {
            textToSend = "¡Esto es lo que encontré en la plataforma VIP! 🚀\n\n" + 
              apps.map(app => `• *${app.name}*: https://appvip2026.vercel.app/apps/${app.slug}`).join('\n');
          } else {
            textToSend = `No encontré "${query}" en la plataforma VIP en este momento. 🔍 Déjame el nombre exacto por aquí y el equipo se encargará de subirlo lo antes posible.`;
          }
        }
      } 
      else if (text.includes('mia') || text.includes('mía')) {
        textToSend = "¡Hola! Escuché mi nombre. 🙋♀️ Soy Mia, tu asistente virtual. Si quieres buscar un juego, pídemelo diciendo: 'Mia busca [nombre]' y lo rastrearé en la web.";
      } 
      else if (text.includes('juego') || text.includes('aplicación') || text.includes('mod') || text.includes('app') || text.includes('apps')) {
        textToSend = "Si estás buscando algo en específico, pídemelo directamente diciendo: 'Mia busca [nombre]' y te generaré el enlace VIP de inmediato. ✨";
      }
    }

    if (textToSend !== "") {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: textToSend,
          parse_mode: 'Markdown'
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error Telegram Webhook:", error);
    return NextResponse.json({ ok: true });
  }
}
