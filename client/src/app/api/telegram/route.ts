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
      const textRaw = message.text;
      const textLower = textRaw.toLowerCase().trim();

      if (textLower === '/start') {
        textToSend = "¡Hola! Soy Mia, tu asistente en App VIP. 🚀 ¿En qué te puedo ayudar hoy?";
      } 
      else if (textLower.includes('busca') || textLower.includes('búscame') || textLower.includes('pásame') || textLower.includes('quiero') || textLower.startsWith('/buscar')) {
        
        // Limpieza inteligente: quitamos detonantes y palabras de relleno comunes
        let query = textLower
          .replace('mia', '')
          .replace('mía', '')
          .replace('búscame', '')
          .replace('busca', '')
          .replace('pásame', '')
          .replace('quiero', '')
          .replace('este', '')
          .replace('juego', '')
          .replace('aplicación', '')
          .replace('aplicacion', '')
          .replace('app', '')
          .replace('mod', '')
          .replace('/buscar', '')
          .trim();

        if (query.length > 0) {
          // Usamos el término limpio para buscar de forma insensible a mayúsculas/minúsculas
          const { data: apps, error } = await supabase
            .from('applications')
            .select('name, slug')
            .ilike('name', `%${query}%`)
            .limit(3);

          if (apps && apps.length > 0) {
            textToSend = "¡Esto es lo que encontré en la plataforma VIP! 🚀\n\n" + 
              apps.map(app => `• *${app.name}*: https://appvip2026.vercel.app/apps/${app.slug}`).join('\n');
          } else {
            // Fallback secundario: si no encuentra por frase completa, intentamos buscar por la primera palabra clave
            const primeraPalabra = query.split(' ')[0];
            const { data: appsFallback } = await supabase
              .from('applications')
              .select('name, slug')
              .ilike('name', `%${primeraPalabra}%`)
              .limit(3);

            if (appsFallback && appsFallback.length > 0) {
              textToSend = "No encontré el nombre exacto, pero quizás te interese esto de la plataforma VIP! 🚀\n\n" + 
                appsFallback.map(app => `• *${app.name}*: https://appvip2026.vercel.app/apps/${app.slug}`).join('\n');
            } else {
              textToSend = `No encontré "${query}" en la plataforma VIP en este momento. 🔍 Déjame el nombre exacto por aquí y el equipo se encargará de subirlo lo antes posible.`;
            }
          }
        }
      } 
      else if (textLower.includes('mia') || textLower.includes('mía')) {
        textToSend = "¡Hola! Escuché mi nombre. 🙋♀️ Soy Mia, tu asistente virtual. Si quieres buscar un juego, pídemelo diciendo: 'Mia busca [nombre]' y lo rastrearé en la web.";
      } 
      else if (textLower.includes('juego') || textLower.includes('aplicación') || textLower.includes('mod') || textLower.includes('app') || textLower.includes('apps')) {
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
