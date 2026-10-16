import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

const GATEWAY_URL = "https://ai-zhan.vercel.app/";
const WEBAPP_URL = "https://ai-zhan.vercel.app/";

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: { id: number; first_name?: string; last_name?: string; username?: string };
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

type GoalRow = {
  id: string;
  user_id: string;
  goal_type: "lose_weight" | "gain_weight" | "maintain";
  gender: "female" | "male" | "other";
  age: number;
  height_cm: number;
  start_weight_kg: number;
  activity_level: "low" | "medium" | "high";
  target_calories: number;
  target_protein_g: number;
  target_fat_g: number;
  target_carbs_g: number;
  plan_data: Record<string, unknown>;
  telegram_chat_id: string | null;
};

const goalLabels: Record<string, string> = {
  lose_weight: "🔥 Арықтау",
  gain_weight: "💪 Салмақ қосу",
  maintain: "⚖️ Форма сақтау",
};

const goalEmojis: Record<string, string> = {
  lose_weight: "🔥",
  gain_weight: "💪",
  maintain: "⚖️",
};

const activityMultiplier: Record<string, number> = {
  low: 1.25,
  medium: 1.45,
  high: 1.65,
};

const goalDelta: Record<string, number> = {
  lose_weight: -350,
  gain_weight: 320,
  maintain: 0,
};

const days = ["Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма", "Сенбі", "Жексенбі"];
const dayEmojis: Record<string, string> = {
  "Дүйсенбі": "🔥", "Сейсенбі": "⚡", "Сәрсенбі": "🧘", "Бейсенбі": "💪",
  "Жұма": "🏃", "Сенбі": "🎯", "Жексенбі": "😴",
};

function getGatewayHeaders() {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
  if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");
  return {
    "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": TELEGRAM_API_KEY,
    "Content-Type": "application/json",
  };
}

function calculatePlan(goal: GoalRow) {
  const baseBmr =
    10 * Number(goal.start_weight_kg) +
    6.25 * Number(goal.height_cm) -
    5 * Number(goal.age) +
    (goal.gender === "male" ? 5 : goal.gender === "female" ? -161 : -78);
  const calories = Math.max(1250, Math.round(baseBmr * activityMultiplier[goal.activity_level] + goalDelta[goal.goal_type]));
  const proteinG = Math.round(Number(goal.start_weight_kg) * (goal.goal_type === "gain_weight" ? 1.9 : goal.goal_type === "lose_weight" ? 1.7 : 1.5));
  const fatG = Math.round((calories * 0.27) / 9);
  const carbsG = Math.max(90, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  const waterLiters = Number(Math.min(3.4, Math.max(1.8, Number(goal.start_weight_kg) * 0.033)).toFixed(1));
  const restDays = goal.goal_type === "gain_weight" ? ["Сәрсенбі", "Жексенбі"] : ["Бейсенбі", "Жексенбі"];

  return {
    calories, proteinG, fatG, carbsG, waterLiters, restDays,
    workouts: days.map((day, index) => {
      if (restDays.includes(day)) return { day, focus: "Қалпына келу", details: "Серуен, созылу, ұйқы режимін сақтау.", intensity: "light" };
      if (goal.goal_type === "lose_weight") return { day, focus: index % 2 === 0 ? "Кардио" : "Толық денеге жеңіл жаттығу", details: "Отырып-тұру, тіреп тұру, қолды бүгіп-жазу.", intensity: "moderate" };
      if (goal.goal_type === "gain_weight") return { day, focus: index % 2 === 0 ? "Күш жаттығулары" : "Жоғарғы/төменгі дене", details: "Орташа салмақ, сет арасында демалу.", intensity: "active" };
      return { day, focus: "Теңгерімді жаттығу", details: "Толық дене жаттығуы, икемділік.", intensity: "moderate" };
    }),
  };
}

function extractCommand(text = "") {
  const [command, ...rest] = text.trim().split(/\s+/);
  return { command: command?.toLowerCase() || "", value: rest.join(" ").trim() };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function progressBar(value: number, max: number, length = 10): string {
  const filled = Math.round((value / max) * length);
  return "▓".repeat(Math.min(filled, length)) + "░".repeat(Math.max(0, length - filled));
}

async function sendTelegram(chatId: string | number, text: string, extra: Record<string, unknown> = {}) {
  const headers = getGatewayHeaders();
  const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...extra,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram API failed [${response.status}]: ${body}`);
  }
}

function mainKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📋 Жоспар", callback_data: "cmd_plan" },
        { text: "📊 Нормалар", callback_data: "cmd_norms" },
      ],
      [
        { text: "✅ Check-in", callback_data: "cmd_checkin_menu" },
        { text: "⚖️ Салмақ", callback_data: "cmd_weight_prompt" },
      ],
      [
        { text: "🔔 Ескертулер", callback_data: "cmd_reminders" },
        { text: "❓ Көмек", callback_data: "cmd_help" },
      ],
      [
        { text: "🌐 AIZHAN ашу", web_app: { url: WEBAPP_URL } },
      ],
    ],
  };
}

function checkinKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "💪 Жаттығу + 💧 Су + 🍽️ Тамақ + 🌙 Ұйқы", callback_data: "checkin_all" }],
      [
        { text: "💪 Жаттығу", callback_data: "checkin_workout" },
        { text: "💧 Су", callback_data: "checkin_water" },
      ],
      [
        { text: "🍽️ Тамақ", callback_data: "checkin_meals" },
        { text: "🌙 Ұйқы", callback_data: "checkin_sleep" },
      ],
      [{ text: "📤 Жіберу", callback_data: "checkin_submit" }],
      [{ text: "◀️ Артқа", callback_data: "cmd_main" }],
    ],
  };
}

function goalKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🔥 Арықтау", callback_data: "goal_lose_weight" }],
      [{ text: "💪 Салмақ қосу", callback_data: "goal_gain_weight" }],
      [{ text: "⚖️ Форма сақтау", callback_data: "goal_maintain" }],
      [{ text: "◀️ Артқа", callback_data: "cmd_main" }],
    ],
  };
}

function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase service credentials are not configured");
  return createClient(url, key);
}

async function getLinkedGoal(supabase: ReturnType<typeof createAdminClient>, chatId: number) {
  const { data } = await supabase
    .from("user_goals")
    .select("*")
    .eq("telegram_chat_id", String(chatId))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as GoalRow | null;
}

async function getProfileName(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  const { data } = await supabase.from("profiles").select("full_name, display_name").eq("user_id", userId).maybeSingle();
  return data?.full_name || data?.display_name || "Пайдаланушы";
}

async function linkByCode(supabase: ReturnType<typeof createAdminClient>, chat: TelegramMessage["chat"], code: string) {
  const normalizedCode = code.replace("/start", "").trim();
  if (!normalizedCode) return null;

  const { data: goal, error } = await supabase
    .from("user_goals")
    .select("*")
    .eq("telegram_link_code", normalizedCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !goal) return null;

  const channels = { ...((goal.notification_channels || {}) as Record<string, boolean>), telegram: true };
  const { data: updated } = await supabase
    .from("user_goals")
    .update({ telegram_chat_id: String(chat.id), notification_channels: channels, telegram_link_code: null })
    .eq("id", goal.id)
    .select("*")
    .single();

  return updated as GoalRow | null;
}

function welcomeText(name: string) {
  return [
    `🎉 <b>Қош келдіңіз, ${name}!</b>`,
    "",
    "AIZHAN Lifestyle бот — сіздің жеке AI фитнес ассистентіңіз.",
    "",
    "🔹 Калория, ақуыз, май, көмірсу нормаларыңыз",
    "🔹 7 күндік жаттығу бағдарламасы",
    "🔹 Салмақ бақылау",
    "🔹 Күнделікті check-in",
    "🔹 Автоматты ескертулер",
    "",
    "Төменгі батырмаларды пайдаланыңыз 👇",
  ].join("\n");
}

function planText(goal: GoalRow, name: string) {
  const plan = calculatePlan(goal);
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const workout = plan.workouts[todayIndex];
  const emoji = dayEmojis[workout.day] || "💪";

  return [
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 <b>${name} — Жеке жоспар</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    "",
    `${goalEmojis[goal.goal_type] || "🎯"} Мақсат: <b>${goalLabels[goal.goal_type]}</b>`,
    "",
    `🔥 Калория: <b>${plan.calories} ккал</b>`,
    `🥩 Ақуыз: <b>${plan.proteinG} г</b>`,
    `🫒 Май: <b>${plan.fatG} г</b>`,
    `🍚 Көмірсу: <b>${plan.carbsG} г</b>`,
    `💧 Су: <b>${plan.waterLiters} л</b>`,
    "",
    `━━━ ${emoji} Бүгін: <b>${workout.day}</b> ━━━`,
    `🏋️ <b>${workout.focus}</b>`,
    `📝 ${workout.details}`,
    "",
    `━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");
}

function normsText(goal: GoalRow) {
  const plan = calculatePlan(goal);
  const total = plan.proteinG * 4 + plan.fatG * 9 + plan.carbsG * 4;
  const proteinPct = Math.round((plan.proteinG * 4 / total) * 100);
  const fatPct = Math.round((plan.fatG * 9 / total) * 100);
  const carbsPct = Math.round((plan.carbsG * 4 / total) * 100);

  return [
    `📊 <b>Тәуліктік нормалар</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    "",
    `🔥 Калория: <b>${plan.calories} ккал</b>`,
    "",
    `🥩 Ақуыз: <b>${plan.proteinG} г</b> (${proteinPct}%)`,
    `   ${progressBar(proteinPct, 100)}`,
    "",
    `🫒 Май: <b>${plan.fatG} г</b> (${fatPct}%)`,
    `   ${progressBar(fatPct, 100)}`,
    "",
    `🍚 Көмірсу: <b>${plan.carbsG} г</b> (${carbsPct}%)`,
    `   ${progressBar(carbsPct, 100)}`,
    "",
    `💧 Су нормасы: <b>${plan.waterLiters} л</b>`,
    "",
    `━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");
}

function weeklyPlanText(goal: GoalRow) {
  const plan = calculatePlan(goal);
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const lines = [
    `🗓 <b>7 күндік жаттығу бағдарламасы</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    "",
  ];

  plan.workouts.forEach((w, i) => {
    const isToday = i === todayIndex;
    const emoji = dayEmojis[w.day] || "📅";
    const marker = isToday ? " 👈 <b>БҮГІН</b>" : "";
    lines.push(`${emoji} <b>${w.day}</b>: ${w.focus}${marker}`);
    lines.push(`   └ ${w.details}`);
    lines.push("");
  });

  lines.push("━━━━━━━━━━━━━━━━━━━━");
  return lines.join("\n");
}

function helpText() {
  return [
    `❓ <b>AIZHAN Lifestyle Bot — Көмек</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    "",
    `📋 /plan — Бүгінгі толық жоспар`,
    `📊 /norms — Калория мен макро нормалар`,
    `🗓 /week — Апталық жаттығу бағдарламасы`,
    `⚖️ /weight 70 — Салмақ жазу`,
    `🎯 /goal — Мақсат ауыстыру`,
    `✅ /checkin — Күнделікті check-in`,
    `🔔 /reminders — Ескертулер тізімі`,
    `🌐 /app — AIZHAN ашу`,
    "",
    "Немесе төмендегі батырмаларды пайдаланыңыз 👇",
    `━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");
}

// Temporary in-memory checkin state for callback flow
const pendingCheckins = new Map<number, Set<string>>();

async function handleCallbackQuery(callbackQuery: { id: string; from: { id: number }; message?: { chat: { id: number }; message_id: number }; data?: string }) {
  const supabase = createAdminClient();
  const chatId = callbackQuery.message?.chat?.id || callbackQuery.from.id;
  const data = callbackQuery.data || "";
  const messageId = callbackQuery.message?.message_id;

  // Answer callback to remove loading state
  const headers = getGatewayHeaders();
  await fetch(`${GATEWAY_URL}/answerCallbackQuery`, {
    method: "POST", headers,
    body: JSON.stringify({ callback_query_id: callbackQuery.id }),
  });

  const goal = await getLinkedGoal(supabase, chatId);

  if (!goal) {
    await sendTelegram(chatId, "❌ Сіз әлі тіркелмегенсіз. Сайттан Telegram байланыстыру кодын алыңыз.");
    return;
  }

  const name = await getProfileName(supabase, goal.user_id);

  if (data === "cmd_main") {
    await sendTelegram(chatId, welcomeText(name), { reply_markup: mainKeyboard() });
    return;
  }

  if (data === "cmd_plan") {
    await sendTelegram(chatId, planText(goal, name), { reply_markup: mainKeyboard() });
    return;
  }

  if (data === "cmd_norms") {
    await sendTelegram(chatId, normsText(goal), { reply_markup: mainKeyboard() });
    return;
  }

  if (data === "cmd_week") {
    await sendTelegram(chatId, weeklyPlanText(goal), { reply_markup: mainKeyboard() });
    return;
  }

  if (data === "cmd_help") {
    await sendTelegram(chatId, helpText(), { reply_markup: mainKeyboard() });
    return;
  }

  if (data === "cmd_reminders") {
    const { data: reminders } = await supabase
      .from("lifestyle_reminders")
      .select("reminder_type, scheduled_time, channel, is_enabled")
      .eq("user_id", goal.user_id)
      .eq("is_enabled", true)
      .order("scheduled_time", { ascending: true });

    const reminderEmojis: Record<string, string> = { meal: "🍽️", water: "💧", workout: "💪", sleep: "🌙" };
    const lines = (reminders || []).map((item) => `${reminderEmojis[item.reminder_type] || "🔔"} ${item.scheduled_time} — ${item.reminder_type}`);
    const text = lines.length
      ? `🔔 <b>Белсенді ескертулер</b>\n━━━━━━━━━━━━━━━━━━━━\n\n${lines.join("\n")}\n\n━━━━━━━━━━━━━━━━━━━━`
      : "🔕 Белсенді ескерту жоқ.\n\nСайттағы Ескерту бөлімінен қосыңыз.";
    await sendTelegram(chatId, text, { reply_markup: mainKeyboard() });
    return;
  }

  if (data === "cmd_checkin_menu") {
    pendingCheckins.set(chatId, new Set());
    await sendTelegram(chatId, "✅ <b>Check-in</b>\n\nОрындаған тапсырмаларды таңдаңыз:", { reply_markup: checkinKeyboard() });
    return;
  }

  if (data === "cmd_weight_prompt") {
    await sendTelegram(chatId, "⚖️ Бүгінгі салмағыңызды жазыңыз:\n\nМысалы: <code>/weight 70</code>", { reply_markup: mainKeyboard() });
    return;
  }

  if (data === "cmd_goal") {
    await sendTelegram(chatId, "🎯 <b>Мақсатты таңдаңыз:</b>", { reply_markup: goalKeyboard() });
    return;
  }

  // Checkin toggles
  if (data.startsWith("checkin_")) {
    const action = data.replace("checkin_", "");
    const current = pendingCheckins.get(chatId) || new Set();

    if (action === "all") {
      ["workout", "water", "meals", "sleep"].forEach(k => current.add(k));
    } else if (action === "submit") {
      const tokens = current;
      await supabase.from("daily_checkins").upsert({
        user_id: goal.user_id, goal_id: goal.id, completed_at: todayStr(),
        workout_done: tokens.has("workout"), water_done: tokens.has("water"),
        meals_done: tokens.has("meals"), sleep_done: tokens.has("sleep"),
        mood_score: tokens.size,
        ai_feedback: tokens.size >= 3 ? "🔥 Керемет! Осы қарқынды сақтаңыз!" : "💫 Бір қадам да прогресс!",
      }, { onConflict: "user_id,completed_at" });

      const bar = progressBar(tokens.size, 4, 4);
      pendingCheckins.delete(chatId);
      await sendTelegram(chatId, `✅ <b>Check-in сақталды!</b>\n\nПрогресс: ${bar} ${tokens.size}/4\n${tokens.size >= 3 ? "🔥 Жарайсыз! Осы қарқынды сақтаңыз!" : "💫 Ертең жалғастырыңыз!"}`, { reply_markup: mainKeyboard() });
      return;
    } else if (["workout", "water", "meals", "sleep"].includes(action)) {
      if (current.has(action)) current.delete(action); else current.add(action);
    }

    pendingCheckins.set(chatId, current);
    const statusEmojis: Record<string, string> = { workout: "💪", water: "💧", meals: "🍽️", sleep: "🌙" };
    const statusText = ["workout", "water", "meals", "sleep"]
      .map(k => `${current.has(k) ? "✅" : "⬜"} ${statusEmojis[k]} ${k}`)
      .join("\n");
    await sendTelegram(chatId, `✅ <b>Check-in</b>\n\n${statusText}\n\nТаңдап болған соң "📤 Жіберу" басыңыз.`, { reply_markup: checkinKeyboard() });
    return;
  }

  // Goal change
  if (data.startsWith("goal_")) {
    const goalType = data.replace("goal_", "");
    if (!["lose_weight", "gain_weight", "maintain"].includes(goalType)) return;
    const nextGoal = { ...goal, goal_type: goalType as GoalRow["goal_type"] };
    const plan = calculatePlan(nextGoal);
    await supabase.from("user_goals").update({
      goal_type: goalType, target_calories: plan.calories,
      target_protein_g: plan.proteinG, target_fat_g: plan.fatG,
      target_carbs_g: plan.carbsG, plan_data: plan,
    }).eq("id", goal.id);
    await sendTelegram(chatId, `🎯 Мақсат жаңартылды: <b>${goalLabels[goalType]}</b>\n\n${planText(nextGoal, name)}`, { reply_markup: mainKeyboard() });
    return;
  }
}

async function handleUserMessage(message: TelegramMessage) {
  const supabase = createAdminClient();
  const { command, value } = extractCommand(message.text || "");

  if (command === "/start") {
    const linked = await linkByCode(supabase, message.chat, value);
    if (!linked) {
      await sendTelegram(message.chat.id, [
        "🤖 <b>AIZHAN Lifestyle Bot</b>",
        "",
        "Қош келдіңіз! Бастау үшін:",
        "",
        "1️⃣ AIZHAN сайтына кіріңіз",
        "2️⃣ Lifestyle → Ескерту бөліміне өтіңіз",
        "3️⃣ Telegram қосу батырмасын басыңыз",
        "4️⃣ Кодты осы ботқа жіберіңіз",
        "",
        "Немесе <code>/start КОД</code> форматында жазыңыз.",
      ].join("\n"));
      return;
    }
    const name = await getProfileName(supabase, linked.user_id);
    await sendTelegram(message.chat.id, `✅ <b>Авторизация сәтті!</b>\n\n${welcomeText(name)}`, { reply_markup: mainKeyboard() });
    return;
  }

  // Link code detection
  if (/^[A-Z0-9]{4,8}$/i.test((message.text || "").trim())) {
    const linked = await linkByCode(supabase, message.chat, (message.text || "").trim());
    if (linked) {
      const name = await getProfileName(supabase, linked.user_id);
      await sendTelegram(message.chat.id, `✅ <b>Код қабылданды!</b>\n\n${welcomeText(name)}`, { reply_markup: mainKeyboard() });
      return;
    }
  }

  const goal = await getLinkedGoal(supabase, message.chat.id);
  if (!goal) {
    await sendTelegram(message.chat.id, "❌ Сіз әлі тіркелмегенсіз.\n\nСайттағы Lifestyle → Ескерту бөлімінен Telegram қосыңыз да, кодты жіберіңіз.");
    return;
  }

  const name = await getProfileName(supabase, goal.user_id);

  if (command === "/help") {
    await sendTelegram(message.chat.id, helpText(), { reply_markup: mainKeyboard() });
    return;
  }

  if (command === "/plan") {
    await sendTelegram(message.chat.id, planText(goal, name), { reply_markup: mainKeyboard() });
    return;
  }

  if (command === "/week") {
    await sendTelegram(message.chat.id, weeklyPlanText(goal), { reply_markup: mainKeyboard() });
    return;
  }

  if (command === "/norms") {
    await sendTelegram(message.chat.id, normsText(goal), { reply_markup: mainKeyboard() });
    return;
  }

  if (command === "/weight") {
    const weight = Number(value.replace(",", "."));
    if (!Number.isFinite(weight) || weight < 25 || weight > 350) {
      await sendTelegram(message.chat.id, "⚖️ Салмақты былай жазыңыз:\n\n<code>/weight 70</code>");
      return;
    }
    await supabase.from("weight_history").insert({ user_id: goal.user_id, goal_id: goal.id, weight_kg: weight, recorded_at: todayStr() });

    // Get last weight for comparison
    const { data: lastWeights } = await supabase.from("weight_history").select("weight_kg").eq("user_id", goal.user_id).order("recorded_at", { ascending: false }).limit(2);
    let delta = "";
    if (lastWeights && lastWeights.length >= 2) {
      const diff = Number((weight - Number(lastWeights[1].weight_kg)).toFixed(1));
      delta = diff > 0 ? `\n📈 Өзгеріс: +${diff} кг` : diff < 0 ? `\n📉 Өзгеріс: ${diff} кг` : "\n➡️ Өзгеріс жоқ";
    }
    await sendTelegram(message.chat.id, `✅ <b>Салмақ жазылды: ${weight} кг</b>${delta}`, { reply_markup: mainKeyboard() });
    return;
  }

  if (command === "/goal") {
    if (!value) {
      await sendTelegram(message.chat.id, "🎯 <b>Мақсатты таңдаңыз:</b>", { reply_markup: goalKeyboard() });
      return;
    }
    if (!["lose_weight", "gain_weight", "maintain"].includes(value)) {
      await sendTelegram(message.chat.id, "🎯 <b>Мақсатты таңдаңыз:</b>", { reply_markup: goalKeyboard() });
      return;
    }
    const nextGoal = { ...goal, goal_type: value as GoalRow["goal_type"] };
    const plan = calculatePlan(nextGoal);
    await supabase.from("user_goals").update({
      goal_type: value, target_calories: plan.calories,
      target_protein_g: plan.proteinG, target_fat_g: plan.fatG,
      target_carbs_g: plan.carbsG, plan_data: plan,
    }).eq("id", goal.id);
    await sendTelegram(message.chat.id, `🎯 Мақсат жаңартылды: <b>${goalLabels[value]}</b>\n\n${planText(nextGoal, name)}`, { reply_markup: mainKeyboard() });
    return;
  }

  if (command === "/checkin") {
    const tokens = value.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      // Show interactive checkin menu
      pendingCheckins.set(message.chat.id, new Set());
      await sendTelegram(message.chat.id, "✅ <b>Check-in</b>\n\nОрындаған тапсырмаларды таңдаңыз:", { reply_markup: checkinKeyboard() });
      return;
    }
    await supabase.from("daily_checkins").upsert({
      user_id: goal.user_id, goal_id: goal.id, completed_at: todayStr(),
      workout_done: tokens.includes("workout"), water_done: tokens.includes("water"),
      meals_done: tokens.includes("meals"), sleep_done: tokens.includes("sleep"),
      mood_score: tokens.length,
      ai_feedback: tokens.length >= 3 ? "🔥 Керемет! Осы қарқынды сақтаңыз!" : "💫 Бір қадам да прогресс!",
    }, { onConflict: "user_id,completed_at" });
    const bar = progressBar(tokens.length, 4, 4);
    await sendTelegram(message.chat.id, `✅ <b>Check-in сақталды!</b>\n\nПрогресс: ${bar} ${tokens.length}/4`, { reply_markup: mainKeyboard() });
    return;
  }

  if (command === "/reminders") {
    const { data } = await supabase
      .from("lifestyle_reminders")
      .select("reminder_type, scheduled_time, channel, is_enabled")
      .eq("user_id", goal.user_id)
      .eq("is_enabled", true)
      .order("scheduled_time", { ascending: true });
    const reminderEmojis: Record<string, string> = { meal: "🍽️", water: "💧", workout: "💪", sleep: "🌙" };
    const lines = (data || []).map((item) => `${reminderEmojis[item.reminder_type] || "🔔"} ${item.scheduled_time} — ${item.reminder_type}`);
    const text = lines.length
      ? `🔔 <b>Белсенді ескертулер</b>\n━━━━━━━━━━━━━━━━━━━━\n\n${lines.join("\n")}\n\n━━━━━━━━━━━━━━━━━━━━`
      : "🔕 Белсенді ескерту жоқ.\n\nСайттағы Ескерту бөлімінен қосыңыз.";
    await sendTelegram(message.chat.id, text, { reply_markup: mainKeyboard() });
    return;
  }

  if (command === "/app") {
    await sendTelegram(message.chat.id, "🌐 <b>AIZHAN ашу</b>\n\nТөмендегі батырманы басыңыз:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🌐 AIZHAN ашу", web_app: { url: WEBAPP_URL } }],
          [{ text: "◀️ Артқа", callback_data: "cmd_main" }],
        ],
      },
    });
    return;
  }

  // Unknown text — show menu
  await sendTelegram(message.chat.id, `🤔 Командаңыз түсініксіз.\n\nТөмендегі батырмаларды пайдаланыңыз 👇`, { reply_markup: mainKeyboard() });
}

async function sendDueNotifications() {
  const supabase = createAdminClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, user_id, title, body")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .limit(50);

  let sent = 0;
  for (const notification of notifications || []) {
    const { data: goal } = await supabase
      .from("user_goals")
      .select("telegram_chat_id")
      .eq("user_id", notification.user_id)
      .not("telegram_chat_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!goal?.telegram_chat_id) continue;

    try {
      await sendTelegram(goal.telegram_chat_id, `🔔 <b>${notification.title}</b>\n\n${notification.body}`);
      await supabase.from("notifications").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", notification.id);
      sent += 1;
    } catch (error) {
      await supabase.from("notifications").update({ status: "failed", metadata: { error: error instanceof Error ? error.message : "Unknown error" } }).eq("id", notification.id);
    }
  }
  return sent;
}

async function pollUpdates() {
  const supabase = createAdminClient();
  const MAX_RUNTIME_MS = 55_000;
  const MIN_REMAINING_MS = 5_000;
  const startTime = Date.now();

  const { data: state } = await supabase
    .from("telegram_bot_state")
    .select("update_offset")
    .eq("id", 1)
    .single();

  let currentOffset = state?.update_offset || 0;
  let totalProcessed = 0;
  const headers = getGatewayHeaders();

  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;
    if (remainingMs < MIN_REMAINING_MS) break;

    const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: "POST",
      headers,
      body: JSON.stringify({ offset: currentOffset, timeout, allowed_updates: ["message", "callback_query"] }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("getUpdates failed:", data);
      break;
    }

    const updates = data.result ?? [];
    if (updates.length === 0) continue;

    for (const update of updates) {
      try {
        if (update.callback_query) {
          await handleCallbackQuery(update.callback_query);
        } else if (update.message) {
          await handleUserMessage(update.message);
        }
      } catch (err) {
        console.error("Error handling update:", err);
      }
    }

    const newOffset = Math.max(...updates.map((u: TelegramUpdate & { callback_query?: unknown }) => u.update_id)) + 1;
    await supabase
      .from("telegram_bot_state")
      .upsert({ id: 1, update_offset: newOffset, updated_at: new Date().toISOString() }, { onConflict: "id" });
    currentOffset = newOffset;
    totalProcessed += updates.length;
  }
  return totalProcessed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();

    if (body?.mode === "send_due") {
      const sent = await sendDueNotifications();
      return new Response(JSON.stringify({ success: true, sent }), { headers: jsonHeaders });
    }

    if (body?.mode === "poll") {
      const processed = await pollUpdates();
      return new Response(JSON.stringify({ ok: true, processed }), { headers: jsonHeaders });
    }

    // Webhook mode — handle both messages and callback queries
    if (body.callback_query) {
      await handleCallbackQuery(body.callback_query);
    } else if (body.message) {
      await handleUserMessage(body.message);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
  } catch (error) {
    console.error("telegram lifestyle bot error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
