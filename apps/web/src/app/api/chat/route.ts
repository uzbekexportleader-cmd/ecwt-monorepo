import { NextResponse, type NextRequest } from 'next/server';

/**
 * ChatGPT proksi.
 *
 * ── "ChatGPT" va "OpenAI" ───────────────────────────────────────────
 * Bular ikki xil narsa emas: ChatGPT — OpenAI ning mahsuloti, va uni
 * ishlatib turgan modellarga (GPT-4o va boshqalar) faqat OpenAI API
 * orqali ulaniladi. Alohida "ChatGPT API" mavjud emas, shuning uchun
 * kalit ham `OPENAI_API_KEY` deb nomlangan — bu aynan ChatGPT kaliti.
 *
 * ── Nega server orqali ──────────────────────────────────────────────
 * OpenAI kalitini brauzerga berib bo'lmaydi: sahifa kodini ochgan har
 * qanday odam uni ko'radi va sizning hisobingizdan foydalanadi. Shuning
 * uchun brauzer FAQAT shu manzilga murojaat qiladi, kalit esa serverda
 * qoladi va hech qachon tashqariga chiqmaydi.
 *
 * ── Suiiste'moldan himoya ───────────────────────────────────────────
 * Bu manzil ochiq: uni istagan odam chaqirishi mumkin va har chaqiruv
 * sizga pul turadi. Shuning uchun uchta chegara bor — xabar uzunligi,
 * suhbat uzunligi va bitta IP dan kelayotgan so'rovlar soni.
 *
 * Chegara xotirada saqlanadi. Bu bitta server uchun yetarli, lekin
 * bir nechta nusxa ishlaganda har biri o'zicha sanaydi. Jiddiy yuk
 * paydo bo'lsa, buni Redis'ga ko'chirish kerak.
 */

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

/**
 * Manzil sozlanadigan: Azure OpenAI, korporativ proksi yoki mahalliy
 * model bilan ishlashga imkon beradi. Sukut bo'yicha — OpenAI ning
 * o'zi.
 */
const BASE_URL = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
const API_URL = `${BASE_URL}/chat/completions`;

/** Bitta xabarda nechta belgi bo'lishi mumkin */
const MAX_CHARS = 2000;
/** Suhbatning nechta oxirgi xabari yuboriladi */
const MAX_MESSAGES = 20;
/** Bitta IP dan shu oynada shuncha so'rov */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 25;

type Role = 'user' | 'assistant';
interface Message {
  role: Role;
  content: string;
}

const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // Xotira cheksiz o'smasin: eskirgan yozuvlarni tozalaymiz
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

/**
 * Bot nimani biladi.
 *
 * Ataylab qat'iy: bilmagan narsasini o'ylab topmasligi kerak. Sayt
 * hali yangi va narx, muddat, komissiya kabi ma'lumotlar aniqlanmagan —
 * bot ularni "taxmin qilsa", odam ishonib qoladi va keyin xafa bo'ladi.
 */
const SYSTEM = `Sen ECWT (E-commerce World Trade) kompaniyasining saytidagi yordamchisan.

ECWT nima qiladi:
- O'zbekistonlik ishlab chiqaruvchilarning mahsulotlarini xalqaro marketplace'larga chiqaradi.
- Hozir ro'yxatda 11 ta marketplace bor: Amazon, eBay, Etsy, Walmart, TikTok Shop, Poshmark, Mercari, Macy's, Bonanza, Alibaba, Facebook Marketplace.
- Hamkorlar: Iqtisodiyot va moliya vazirligi, Kambag'allikni qisqartirish va bandlik vazirligi, IT Park, Innovatsion rivojlanish vazirligi.
- Global elektron tijorat bozori ~6 trillion dollar, 2027 yilga borib 8 trillionga yetishi kutilmoqda.
- Saytda "Mahsulotingizni soting" tugmasi bor — u ro'yxatdan o'tish jarayonini boshlaydi.

Qoidalar:
1. Foydalanuvchi qaysi tilda yozsa, o'sha tilda javob ber (o'zbek, rus yoki ingliz).
2. Qisqa yoz: ikki-uch jumla. Ro'yxat kerak bo'lsa qisqa punktlar.
3. NARX, KOMISSIYA, MUDDAT, shartnoma shartlari va statistikani O'YLAB TOPMA. Bilmasang: "Bu ma'lumot hali saytda yo'q, ECWT jamoasi bilan bog'laning" deb ayt.
4. Raqobatchilarni yomonlama, va'da berma.
5. Mavzudan tashqari savollarga qisqa javob ber va suhbatni ECWT ga qaytar.`;

export async function POST(request: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    // Kalit yo'q — bu xato emas, sozlanmagan holat. Klient buni
    // alohida ko'rsatadi.
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'nomalum';

  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let messages: Message[];
  try {
    const body = (await request.json()) as { messages?: unknown };
    if (!Array.isArray(body.messages)) throw new Error('messages massiv emas');

    messages = body.messages
      .filter(
        (m): m is Message =>
          !!m &&
          typeof m === 'object' &&
          (('role' in m && (m as Message).role === 'user') || (m as Message).role === 'assistant') &&
          typeof (m as Message).content === 'string',
      )
      .slice(-MAX_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

    if (messages.length === 0) throw new Error('bo‘sh suhbat');
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const upstream = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      temperature: 0.4,
      max_tokens: 400,
      messages: [{ role: 'system', content: SYSTEM }, ...messages],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    // Kalit yoki hisob muammosi — buni logda ko'rish kerak, lekin
    // brauzerga tafsilot bermaymiz
    console.error('[chat] OpenAI xatosi', upstream.status, detail.slice(0, 400));
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }

  /**
   * OpenAI javobi SSE ko'rinishida keladi: har qatorda `data: {...}`.
   * Biz uni ochib, faqat MATNNI uzatamiz — klientda JSON tahlil
   * qilish kerak bo'lmaydi.
   */
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Oxirgi bo'lak to'liq bo'lmasligi mumkin — keyingi o'qishga qoldiramiz
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;

            const payload = trimmed.slice(5).trim();
            if (payload === '[DONE]') continue;

            try {
              const json = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const text = json.choices?.[0]?.delta?.content;
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // Bitta buzuq bo'lak butun javobni to'xtatmasin
            }
          }
        }
      } catch (error) {
        console.error('[chat] oqim uzildi', error);
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
