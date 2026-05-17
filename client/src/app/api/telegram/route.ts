import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SITE_URL = 'https://appvip2026.vercel.app';

const SEARCH_TRIGGERS = ['busca', 'búscame', 'buscame', 'pásame', 'pasame', 'quiero', 'necesito', 'tienes', 'tienen', 'descarga', 'descargar'];

async function sendMessage(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

function isSearchIntent(text: string): boolean {
  const lower = text.toLowerCase();
  if (lower.startsWith('/buscar')) return true;
  return SEARCH_TRIGGERS.some(kw => lower.includes(kw));
}

function extractSearchTerm(text: string): string | null {
  let cleaned = text.toLowerCase().trim();

  if (cleaned.startsWith('/buscar')) {
    cleaned = cleaned.replace(/^\/buscar\s*/, '');
  }

  for (const kw of SEARCH_TRIGGERS) {
    cleaned = cleaned.replace(new RegExp(`\\b${kw}\\b`, 'gi'), '');
  }

  cleaned = cleaned.replace(/\bmía?\b/gi, '');
  cleaned = cleaned.replace(/[,.:!?¿¡]/g, '').replace(/\s+/g, ' ').trim();

  return cleaned.length >= 2 ? cleaned : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body?.message;

    if (!message || !message.chat || !message.chat.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    let textToSend = '';

    // ── 1. Bienvenida a nuevos miembros ──
    if (message.new_chat_members && message.new_chat_members.length > 0) {
      const names = message.new_chat_members.map((m: any) => m.first_name).join(', ');
      textToSend = `¡Hola ${names}! 👋 Bienvenidos a la comunidad VIP. Soy Mia, la asistente del grupo. Si gustas pedir una aplicación o aportar alguna sugerencia, puedes hacerlo libremente por aquí. ¡Disfruta del contenido! 🚀`;

    // ── 2. Mensajes de texto ──
    } else if (message.text) {
      const text: string = message.text;
      const lower = text.toLowerCase();

      // /start
      if (lower === '/start') {
        textToSend = '¡Hola! Soy Mia, tu asistente en App VIP. 🚀 ¿En qué te puedo ayudar hoy?';

      // ── 3. Búsqueda en base de datos ──
      } else if (isSearchIntent(lower) || lower.startsWith('/buscar')) {
        const searchTerm = extractSearchTerm(text);

        if (searchTerm) {
          // Tabla real: "applications", campo nombre: "name", identificador: "id"
          const { data: apps, error } = await supabase
            .from('applications')
            .select('id, name, version, category')
            .ilike('name', `%${searchTerm}%`)
            .limit(3);

          if (error) {
            console.error('❌ Error buscando en Supabase:', error);
            textToSend = 'Tuve un problema al buscar en la base de datos. 😕 Intenta de nuevo en un momento.';
          } else if (apps && apps.length > 0) {
            const list = apps
              .map((app: any) => `• ${app.name} (${app.category} — v${app.version || '?'})\n  🔗 ${SITE_URL}/apps/${app.id}`)
              .join('\n\n');

            textToSend = `¡Esto es lo que encontré en la plataforma VIP! 🚀\n\n${list}`;
          } else {
            textToSend = `No encontré "${searchTerm}" en la plataforma VIP en este momento. 🔍 Déjame el nombre exacto por aquí y el equipo se encargará de subirlo lo antes posible.`;
          }
        } else {
          textToSend = 'Dime el nombre de la aplicación o juego que buscas y lo buscaré en la plataforma VIP. 🔍';
        }

      // ── 4. Mención de Mia ──
      } else if (lower.includes('mia') || lower.includes('mía')) {
        textToSend = '¡Hola! Escuché mi nombre. 🙋♀️ Soy Mia, tu asistente virtual. ¿En qué te puedo ayudar hoy? Puedes pedirme aplicaciones o juegos y el equipo los subirá pronto.';

      // ── 5. Palabras clave genéricas ──
      } else if (lower.includes('juego') || lower.includes('aplicación') || lower.includes('mod') || lower.includes('app') || lower.includes('apps')) {
        textToSend = 'Si estás buscando algo en específico, deja el nombre aquí y estaremos revisando para subirlo a la plataforma VIP. ✨';
      }
    }

    if (textToSend !== '') {
      await sendMessage(chatId, textToSend);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error Telegram Webhook:', error);
    return NextResponse.json({ ok: true });
  }
}
