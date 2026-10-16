import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const FREE_LIMIT = 5;
const FREE_WINDOW_HOURS = 12;
const FREE_WINDOW_MS = FREE_WINDOW_HOURS * 60 * 60 * 1000;

const multiLangInstruction = `IMPORTANT: You MUST detect the language of the user's message and reply in THE SAME LANGUAGE. If the user writes in English, reply in English. If in Kazakh, reply in Kazakh. If in Russian, reply in Russian. Always match the user's language.`;

const systemPrompts: Record<string, string> = {
  medical: `Сен AIZHAN — ҚР Денсаулық сақтау министрлігінің ресми Клиникалық хаттамаларына (Клинические протоколы МЗ РК / MedElement) негізделген медициналық AI көмекшісісің.
МЕДИЦИНАЛЫҚ ТАЛДАУ ЖӘНЕ КЕҢЕС БЕРУ ЕРЕЖЕЛЕРІ:
1. Бірінші кезекте ҚР ресми Клиникалық хаттамаларының деректерін басшылыққа ал.
2. ЖЫНЫСТЫҚ СӘЙКЕСТІКТІ ҚАТАҢ САҚТА: Еркектерге тән хаттамаларды (простата, аталық без, урология) әйелдерге/қыздарға, ал әйелдерге тән хаттамаларды (акушерия, гинекология, жүктілік, жатыр, аналық без) ер адамдарға/ұлдарға МҮЛДЕМ ҰСЫНБА.
3. ҚОСЫМША НАҚТЫЛАУ СҰРАҚТАРЫ: Егер пайдаланушы симптомдары жалпы немесе бірнеше хаттамадағы шағымдарға («Жалобы и анамнез») бірдей ұқсас болып тұрса:
   - Нақты қай протоколға дәл керектігін анықтау үшін 3-4 нақтылау сұрағын қой (науқастың жынысы мен жасы, ауырсынудың нақты орны мен сипаты, басталған уақыты, қосымша симптомдар).
4. НАҚТЫ ХАТТАМАНЫ СЕНІМДІ ТАҢДАУ: Пайдаланушының жазғандары мен қосымша жауаптары жеткілікті болса:
   - Нақты біреуін сенімді таңдап: "Сіздің симптомдарыңыз ҚР клиникалық протоколы бойынша: [Хаттама атауы (МКБ-10)] ауруына сәйкес келеді" деп жаз.
   - Хаттамадағы негізгі шағымдар мен белгілерді («Жалобы и анамнез») салыстырып түсіндір.
   - Протокол бойынша алғашқы көмек және емделу жолдарын (амбулаториялық бағыт, режим) көрсет.
   - Қай кезде шұғыл дәрігерге бару керектігін (госпитализация көрсеткіштері, қауіп белгілері) нақты айт.
5. РЕСМИ СІЛТЕМЕ: Жауаптың соңында міндетті түрде нақты клиникалық хаттамаға тікелей MedElement ресми сілтемесін (https://diseases.medelement.com/disease/...) бер.
Ескерту: AI дәрігерді алмастырмайды, бұл ақпарат ҚР хаттамалары негізінде беріледі. ${multiLangInstruction}`,
  psychology: `Сен AIZHAN — психологиялық қолдау көрсететін AI көмекші. Стресс, тұңғую, мотивация, қарым-қатынас мәселелері бойынша кеңес бересің. Жауаптарды эмпатиямен бер. Қажет болса маман психологқа жүгінуді ұсын. ${multiLangInstruction}`,
  motivation: `Сен AIZHAN — мотивациялық AI көмекші. Адамдарды ынталандырасың, мақсатқа жетуге, табысқа жетуге, өмірлік кеңестер бересің. Жауаптарды шабыттандыратын тұрғыда бер. ${multiLangInstruction}`,
  nutrition: `Сен AIZHAN — тамақтану бойынша AI кеңесші. Дұрыс тамақтану, диета, витаминдер, арықтау, салмақ қосу туралы ғылыми негізде кеңес бересің. ${multiLangInstruction}`,
  fitness: `Сен AIZHAN — фитнес және спорт бойынша AI көмекші. Жаттығу жоспарлары, спорт түрлері, денсаулық үшін қозғалыс туралы кеңес бересің. ${multiLangInstruction}`,
  medicine: `Сен AIZHAN — дәрі-дәрмек туралы AI анықтамалық. Дәрінің қолданылуы, дозасы, жанама әсерлері, қарсы көрсетілімдері туралы толық ақпарат бересің. Міндетті түрде дәрігермен кеңесуді ұсын. ${multiLangInstruction}`,
};

const freePromptSuffix = `

Тегін жоспар ережесі: жауапты қысқа, жалпы бағыт беретін, қауіпсіз және түсінікті қыл. Терең талдау, ұзақ жоспар, бірнеше балама сценарий және персонализацияны шектеп бер.`;

const proPromptSuffix = `

Pro жоспар ережесі: жауапты тегін жоспардан сапалырақ, толық, құрылымды және практикалық қыл. Қажет болса қадамдық жоспар, себеп-салдар, қауіп белгілері, нақты бақылау сұрақтары және келесі әрекеттерді қос. Медициналық тақырыпта диагноз қоймай, қауіпсіздік ескертулерін сақта.`;

const getAuthenticatedUser = async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("Authorization") || "";

  if (!supabaseUrl || !anonKey || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await authClient.auth.getUser();

  if (error) return null;
  return data.user;
};

const getAdminClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey);
};

const toUsagePayload = (usedCount: number, windowStartedAt: string, limitExhaustedAt: string | null) => {
  const resetAt = new Date(new Date(windowStartedAt).getTime() + FREE_WINDOW_MS).toISOString();

  return {
    todayCount: usedCount,
    usedCount,
    remaining: Math.max(FREE_LIMIT - usedCount, 0),
    limit: FREE_LIMIT,
    windowHours: FREE_WINDOW_HOURS,
    windowStartedAt,
    resetAt,
    limitExhaustedAt,
  };
};

const getUsageState = async (userId: string) => {
  const adminClient = getAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("subscription_plan, pro_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) throw profileError;

  const proExpiresAt = profile?.pro_expires_at ? new Date(profile.pro_expires_at).getTime() : null;
  const isPro = profile?.subscription_plan === "pro" && (!proExpiresAt || proExpiresAt > Date.now());

  if (isPro) {
    return {
      isPro,
      todayCount: 0,
      usedCount: 0,
      remaining: null as number | null,
      limit: null as number | null,
      windowHours: null as number | null,
      windowStartedAt: null as string | null,
      resetAt: null as string | null,
      limitExhaustedAt: null as string | null,
    };
  }

  const now = new Date();
  const { data: usageRow, error: usageError } = await adminClient
    .from("ai_usage_limits")
    .select("window_started_at, used_count, limit_exhausted_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (usageError) throw usageError;

  if (!usageRow) {
    const windowStartedAt = now.toISOString();
    const { data: insertedUsage, error: insertError } = await adminClient
      .from("ai_usage_limits")
      .insert({
        user_id: userId,
        window_started_at: windowStartedAt,
        used_count: 0,
        limit_exhausted_at: null,
      })
      .select("window_started_at, used_count, limit_exhausted_at")
      .single();

    if (insertError) throw insertError;

    return {
      isPro,
      ...toUsagePayload(insertedUsage.used_count, insertedUsage.window_started_at, insertedUsage.limit_exhausted_at),
    };
  }

  const windowStartedMs = new Date(usageRow.window_started_at).getTime();
  const windowExpired = now.getTime() - windowStartedMs >= FREE_WINDOW_MS;

  if (windowExpired) {
    const windowStartedAt = now.toISOString();
    const { data: resetUsage, error: resetError } = await adminClient
      .from("ai_usage_limits")
      .update({
        window_started_at: windowStartedAt,
        used_count: 0,
        limit_exhausted_at: null,
        updated_at: windowStartedAt,
      })
      .eq("user_id", userId)
      .select("window_started_at, used_count, limit_exhausted_at")
      .single();

    if (resetError) throw resetError;

    return {
      isPro,
      ...toUsagePayload(resetUsage.used_count, resetUsage.window_started_at, resetUsage.limit_exhausted_at),
    };
  }

  return {
    isPro,
    ...toUsagePayload(usageRow.used_count, usageRow.window_started_at, usageRow.limit_exhausted_at),
  };
};

const consumeFreeQuestion = async (userId: string, usage: Awaited<ReturnType<typeof getUsageState>>) => {
  if (usage.isPro || usage.remaining === null || !usage.windowStartedAt) return usage;
  if (usage.remaining <= 0) return usage;

  const adminClient = getAdminClient();
  const nextUsedCount = Math.min((usage.usedCount || 0) + 1, FREE_LIMIT);
  const nowIso = new Date().toISOString();
  const limitExhaustedAt = nextUsedCount >= FREE_LIMIT ? nowIso : usage.limitExhaustedAt;

  const { data, error } = await adminClient
    .from("ai_usage_limits")
    .update({
      used_count: nextUsedCount,
      limit_exhausted_at: limitExhaustedAt,
      updated_at: nowIso,
    })
    .eq("user_id", userId)
    .select("window_started_at, used_count, limit_exhausted_at")
    .single();

  if (error) throw error;

  return {
    ...usage,
    ...toUsagePayload(data.used_count, data.window_started_at, data.limit_exhausted_at),
  };
};

const getAiHealth = async () => {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";

  if (!OPENAI_API_KEY) {
    return {
      ok: false,
      status: 503,
      message: "OPENAI_API_KEY конфигурацияланбаған.",
      model: OPENAI_MODEL,
    };
  }

  const healthResponse = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
  });

  if (healthResponse.ok) {
    return {
      ok: true,
      status: 200,
      message: "AI backend қолжетімді.",
      model: OPENAI_MODEL,
    };
  }

  const rawError = await healthResponse.text();
  let message = "AI backend уақытша қолжетімсіз.";

  if (healthResponse.status === 401) {
    message = "OPENAI_API_KEY жарамсыз немесе рұқсат жоқ.";
  } else if (healthResponse.status === 429) {
    message = "Сұраныс шегінен асты, кейінірек қайталаңыз.";
  } else if (rawError?.trim()) {
    message = rawError;
  }

  console.error("OpenAI health error:", healthResponse.status, rawError);

  return {
    ok: false,
    status: healthResponse.status,
    message,
    model: OPENAI_MODEL,
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);

    if (req.method === "GET" && url.searchParams.get("health") === "1") {
      const health = await getAiHealth();

      return new Response(JSON.stringify({
        status: health.ok ? "available" : "unavailable",
        message: health.message,
        model: health.model,
      }), {
        status: health.status,
        headers: jsonHeaders,
      });
    }

    const { messages, mode, protocolContext } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const FREE_OPENAI_MODEL = Deno.env.get("OPENAI_FREE_MODEL") || Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
    const PRO_OPENAI_MODEL = Deno.env.get("OPENAI_PRO_MODEL") || Deno.env.get("OPENAI_MODEL") || "gpt-4o";

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured (use supabase/functions/.env for local or Supabase secrets for production)");
    }

    const user = await getAuthenticatedUser(req);

    if (!user) {
      return new Response(JSON.stringify({ error: "Алдымен аккаунтқа кіріңіз." }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const usage = await getUsageState(user.id);

    if (!usage.isPro && (usage.remaining || 0) <= 0) {
      return new Response(JSON.stringify({
        error: "5 сұрақ лимиті бітті. 12 сағаттан кейін жаңа лимит беріледі немесе Pro жазылымын қоссаңыз, лимитсіз қолдана аласыз.",
        code: "FREE_LIMIT_REACHED",
        usage,
      }), {
        status: 402,
        headers: jsonHeaders,
      });
    }

    const consumedUsage = await consumeFreeQuestion(user.id, usage);

    let systemPrompt = `${systemPrompts[mode] || systemPrompts.medical}${consumedUsage.isPro ? proPromptSuffix : freePromptSuffix}`;
    if (typeof protocolContext === "string" && protocolContext.trim()) {
      systemPrompt += `\n\n${protocolContext.trim()}`;
    }
    const selectedModel = consumedUsage.isPro ? PRO_OPENAI_MODEL : FREE_OPENAI_MODEL;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: false,
      }),
    });

    if (!response.ok) {
      const rawError = await response.text();
      let upstreamMessage = "AI қатесі";

      try {
        const parsed = JSON.parse(rawError);
        upstreamMessage = parsed?.error?.message || upstreamMessage;
      } catch {
        if (rawError?.trim()) upstreamMessage = rawError;
      }

      if (response.status === 429) {
        upstreamMessage = "Сұраныс шегінен асты, кейінірек қайталаңыз.";
      }

      if (response.status === 401) {
        upstreamMessage = "OPENAI_API_KEY жарамсыз немесе рұқсат жоқ.";
      }

      console.error("OpenAI error:", response.status, rawError);
      return new Response(JSON.stringify({ error: upstreamMessage }), {
        status: response.status,
        headers: jsonHeaders,
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const finalContent = typeof content === "string" ? content : "";
    const lastUserMessage = Array.isArray(messages)
      ? [...messages].reverse().find((message) => message?.role === "user")?.content
      : null;

    if (typeof lastUserMessage === "string" && lastUserMessage.trim()) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && serviceRoleKey) {
        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        const { error: insertError } = await adminClient.from("chat_messages").insert({
          user_id: user.id,
          mode: typeof mode === "string" ? mode : "medical",
          user_message: lastUserMessage.trim(),
          ai_response: finalContent,
        });

        if (insertError) {
          console.error("chat history insert error:", insertError);
        }
      }
    }

    return new Response(JSON.stringify({
      content: finalContent,
      usage: consumedUsage,
      plan: consumedUsage.isPro ? "pro" : "free",
      model: selectedModel,
    }), {
      headers: jsonHeaders,
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Белгісіз қате" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
