import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useProStatus } from "@/hooks/use-pro-status";
import { supabase } from "@/integrations/supabase/client";
import { safeUUID } from "@/lib/safe-uuid";
import {
  AlertTriangle,
  Apple,
  Bell,
  CheckCircle2,
  ChevronRight,
  Copy,
  Crown,
  Droplets,
  Dumbbell,
  ExternalLink,
  Flame,
  HeartPulse,
  Lock,
  Moon,
  Plus,
  Save,
  Scale,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  Utensils,
  
} from "lucide-react";
import {
  ActivityLevel,
  BloodPressure,
  Gender,
  LifestyleGoal,
  activityLabels,
  bloodPressureLabels,
  calculateLifestylePlan,
  goalLabels,
  parseAllergies,
} from "@/lib/lifestyle";
import { CheckInChart, GoalProgressCard, HealthMetricsCard, MacroDonutCard, WeightChart } from "@/components/lifestyle/LifestyleCharts";

type ReminderChannel = "in_app" | "browser" | "telegram";
type ActiveSection = "dashboard" | "profile" | "plan" | "tracking" | "notifications";

const today = new Date().toISOString().slice(0, 10);

const reminderTypes = [
  { key: "meal", label: "Тамақ", time: "08:00", icon: Apple, emoji: "🍽️" },
  { key: "water", label: "Су", time: "10:30", icon: Droplets, emoji: "💧" },
  { key: "workout", label: "Жаттығу", time: "18:30", icon: Dumbbell, emoji: "💪" },
  { key: "sleep", label: "Ұйқы", time: "22:30", icon: Moon, emoji: "🌙" },
] as const;

const dayEmojis: Record<string, string> = {
  "Дүйсенбі": "🔥", "Сейсенбі": "⚡", "Сәрсенбі": "🧘", "Бейсенбі": "💪",
  "Жұма": "🏃", "Сенбі": "🎯", "Жексенбі": "😴",
};

const intensityColors: Record<string, string> = {
  light: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  moderate: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  active: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const LifestylePage = () => {
  const { user } = useAuth();
  const { isPro, loading: proLoading } = useProStatus();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");
  const [goalId, setGoalId] = useState<string | null>(null);

  // Profile fields
  const [gender, setGender] = useState<Gender>("female");
  const [age, setAge] = useState("25");
  const [heightCm, setHeightCm] = useState("165");
  const [weightKg, setWeightKg] = useState("60");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("medium");
  const [goal, setGoal] = useState<LifestyleGoal>("maintain");
  const [allergies, setAllergies] = useState("");
  const [bloodPressure, setBloodPressure] = useState<BloodPressure>("unknown");

  // Tracking
  const [weightEntry, setWeightEntry] = useState("");
  const [checkIn, setCheckIn] = useState({ workout: false, water: false, meals: false, sleep: false });

  // Notifications
  const [reminderChannels, setReminderChannels] = useState<Record<ReminderChannel, boolean>>({ in_app: true, browser: false, telegram: false });
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramLinkCode, setTelegramLinkCode] = useState("");
  const [reminders, setReminders] = useState<Record<string, boolean>>({ meal: true, water: true, workout: true, sleep: true });
  const [reminderTimes, setReminderTimes] = useState<Record<string, string>>({ meal: "08:00", water: "10:30", workout: "18:30", sleep: "22:30" });

  // Data
  const [recentWeights, setRecentWeights] = useState<Array<{ id: string; weight_kg: number; recorded_at: string }>>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<Array<{ id: string; completed_at: string; workout_done: boolean; water_done: boolean; meals_done: boolean; sleep_done: boolean }>>([]);

  const botUrl = import.meta.env.VITE_TELEGRAM_BOT_URL || "https://t.me/@bot_aizhan_bot";

  const numericProfile = useMemo(() => ({
    gender, age: Number(age) || 25, heightCm: Number(heightCm) || 165, weightKg: Number(weightKg) || 60,
    activityLevel, goal, allergies: parseAllergies(allergies), bloodPressure,
  }), [activityLevel, age, allergies, bloodPressure, gender, goal, heightCm, weightKg]);

  const plan = useMemo(() => calculateLifestylePlan(numericProfile), [numericProfile]);
  const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const currentDayWorkout = plan.workouts[currentDayIndex];
  const completedCount = Object.values(checkIn).filter(Boolean).length;
  const streak = recentCheckIns.filter((i) => i.workout_done || i.water_done || i.meals_done || i.sleep_done).length;
  const lastWeight = recentWeights[0]?.weight_kg;
  const firstWeight = recentWeights[recentWeights.length - 1]?.weight_kg;
  const weightDelta = typeof lastWeight === "number" && typeof firstWeight === "number" ? Number((lastWeight - firstWeight).toFixed(1)) : 0;

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const load = async () => {
      const [{ data: profile }, { data: goals }, { data: weights }, { data: checks }] = await Promise.all([
        supabase.from("profiles").select("allergies, blood_pressure").eq("user_id", user.id).single(),
        supabase.from("user_goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("weight_history").select("id, weight_kg, recorded_at").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(14),
        supabase.from("daily_checkins").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(7),
      ]);
      if (!isMounted) return;

      const p = profile as { allergies?: string[] | null; blood_pressure?: BloodPressure | null } | null;
      if (p?.allergies?.length) setAllergies(p.allergies.join(", "));
      if (p?.blood_pressure) setBloodPressure(p.blood_pressure);

      const g = goals as unknown as {
        id: string; gender: Gender; age: number; height_cm: number; start_weight_kg: number;
        activity_level: ActivityLevel; goal_type: LifestyleGoal;
        notification_channels?: Record<ReminderChannel, boolean> | null;
        telegram_chat_id?: string | null; telegram_link_code?: string | null;
      } | null;

      if (g) {
        setGoalId(g.id); setGender(g.gender); setAge(String(g.age));
        setHeightCm(String(g.height_cm)); setWeightKg(String(g.start_weight_kg));
        setWeightEntry(String(g.start_weight_kg)); setActivityLevel(g.activity_level);
        setGoal(g.goal_type);
        setReminderChannels((c) => ({ ...c, ...(g.notification_channels || {}) }));
        setTelegramChatId(g.telegram_chat_id || ""); setTelegramLinkCode(g.telegram_link_code || "");
      }

      setRecentWeights((weights || []) as typeof recentWeights);
      setRecentCheckIns((checks || []) as typeof recentCheckIns);
    };
    void load();
    return () => { isMounted = false; };
  }, [user]);

  const savePlan = async () => {
    if (!user) return;
    setLoading(true);
    const profileUpdate = supabase.from("profiles").update({ allergies: numericProfile.allergies, blood_pressure: bloodPressure }).eq("user_id", user.id);
    const goalPayload = {
      user_id: user.id, gender, age: numericProfile.age, height_cm: numericProfile.heightCm,
      start_weight_kg: numericProfile.weightKg, activity_level: activityLevel, goal_type: goal,
      target_calories: plan.calories, target_protein_g: plan.proteinG, target_fat_g: plan.fatG,
      target_carbs_g: plan.carbsG, plan_data: plan, notification_channels: reminderChannels,
      telegram_chat_id: telegramChatId.trim() || null,
    };
    const goalReq = goalId
      ? supabase.from("user_goals").update(goalPayload as never).eq("id", goalId).select("id").single()
      : supabase.from("user_goals").insert(goalPayload as never).select("id").single();

    const [{ error: pe }, { data, error: ge }] = await Promise.all([profileUpdate, goalReq]);
    const newId = (data as { id: string } | null)?.id || goalId;
    if (!pe && !ge && newId) {
      await saveReminders(newId);
      setGoalId(newId);
      toast({ title: "✅ Жоспар сақталды" });
    } else {
      toast({ title: "Қате", description: pe?.message || ge?.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const saveReminders = async (activeGoalId: string) => {
    if (!user) return;
    const rows = reminderTypes.filter((i) => reminders[i.key]).map((i) => ({
      user_id: user.id, goal_id: activeGoalId, reminder_type: i.key,
      channel: reminderChannels.telegram ? "telegram" : reminderChannels.browser ? "browser" : "in_app",
      scheduled_time: reminderTimes[i.key], is_enabled: true,
      message_template: i.key === "workout" ? "Бүгін жаттығу күніңіз!" : i.key === "water" ? `Су ішіңіз. Мақсат: ${plan.waterLiters} л.` : i.key === "sleep" ? "Ұйқу режимін сақтаңыз." : "Тамақтану уақыты.",
    }));
    if (rows.length > 0) await supabase.from("lifestyle_reminders").upsert(rows, { onConflict: "user_id,reminder_type,channel" });
  };

  const saveCheckIn = async () => {
    if (!user) return;
    const { error } = await supabase.from("daily_checkins").upsert({
      user_id: user.id, goal_id: goalId, completed_at: today,
      workout_done: checkIn.workout, water_done: checkIn.water, meals_done: checkIn.meals, sleep_done: checkIn.sleep,
      mood_score: completedCount,
      ai_feedback: completedCount >= 3 ? "Керемет! Осы қарқынды сақтаңыз 🔥" : "Кішкене ғана қадам — үлкен нәтиже.",
    }, { onConflict: "user_id,completed_at" });
    if (error) { toast({ title: "Қате", description: error.message, variant: "destructive" }); return; }
    toast({ title: completedCount >= 3 ? "🔥 Жарайсыз!" : "✅ Сақталды" });
  };

  const saveWeight = async () => {
    if (!user || !weightEntry) return;
    const v = Number(weightEntry);
    const { error } = await supabase.from("weight_history").insert({ user_id: user.id, goal_id: goalId, weight_kg: v, recorded_at: today });
    if (error) { toast({ title: "Қате", description: error.message, variant: "destructive" }); return; }
    setRecentWeights([{ id: safeUUID(), weight_kg: v, recorded_at: today }, ...recentWeights].slice(0, 14));
    toast({ title: "📊 Салмақ жазылды" });
  };

  const requestBrowserNotifications = async () => {
    if (!("Notification" in window)) { toast({ title: "Қолдау жоқ", variant: "destructive" }); return; }
    const p = await Notification.requestPermission();
    if (p === "granted") { setReminderChannels((c) => ({ ...c, browser: true })); new Notification("AIZHAN", { body: "Браузер ескертулері қосылды ✅" }); }
  };

  const generateLinkCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleTelegramToggle = async (enabled: boolean) => {
    setReminderChannels((c) => ({ ...c, telegram: enabled }));
    if (enabled && !telegramChatId && user) {
      const code = generateLinkCode();
      setTelegramLinkCode(code);
      // Save code to DB immediately
      if (goalId) {
        await supabase.from("user_goals").update({ telegram_link_code: code } as never).eq("id", goalId);
      }
    }
  };

  const copyTelegramLinkCode = async () => {
    if (!telegramLinkCode) { toast({ title: "Код жоқ" }); return; }
    await navigator.clipboard.writeText(telegramLinkCode);
    toast({ title: "📋 Код көшірілді" });
  };

  // Pro gate — non-Pro users see a promo screen
  if (!proLoading && !isPro) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="relative mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-medical shadow-elevated">
              <HeartPulse className="h-9 w-9 text-primary-foreground" />
            </div>
            <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 shadow-lg">
              <Crown className="h-4 w-4 text-amber-900" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI Lifestyle Coach</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Жеке диетолог, фитнес тренер және дисциплина ассистенті — барлығы бір жерде. Pro жазылым арқылы ашыңыз.
          </p>
          <div className="mt-6 grid w-full max-w-sm gap-3">
            {[
              { icon: Utensils, text: "Жеке калория және макро жоспар" },
              { icon: Dumbbell, text: "7 күндік жаттығу бағдарламасы" },
              { icon: Scale, text: "Салмақ прогресі бақылау" },
              { icon: Bell, text: "Telegram / push ескертулер" },
              { icon: Target, text: "AI күнделікті тексеру (check-in)" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left text-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <span>{f.text}</span>
                <Lock className="ml-auto h-4 w-4 text-muted-foreground/50" />
              </div>
            ))}
          </div>
          <Button onClick={() => navigate("/pro")} className="mt-6 h-12 rounded-2xl gradient-medical px-8 text-base font-semibold text-primary-foreground shadow-elevated">
            <Crown className="mr-2 h-5 w-5" /> Pro жазылым алу
          </Button>
        </div>
      </Layout>
    );
  }

  if (proLoading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      </Layout>
    );
  }

  const navItems: { key: ActiveSection; label: string; icon: React.ElementType; emoji: string }[] = [
    { key: "dashboard", label: "Басты", icon: Sparkles, emoji: "✨" },
    { key: "profile", label: "Профиль", icon: User, emoji: "👤" },
    { key: "plan", label: "Жоспар", icon: Apple, emoji: "🍎" },
    { key: "tracking", label: "Бақылау", icon: Target, emoji: "🎯" },
    { key: "notifications", label: "Ескерту", icon: Bell, emoji: "🔔" },
  ];

  return (
    <Layout>
      <div className="space-y-4 pb-8">
        {/* Navigation pills */}
        <nav className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all ${
                activeSection === item.key
                  ? "gradient-medical text-primary-foreground shadow-card"
                  : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <span className="text-base">{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Dashboard */}
        {activeSection === "dashboard" && (
          <div className="space-y-4">
            {/* Hero stats */}
            <div className="rounded-3xl gradient-medical p-5 text-primary-foreground shadow-elevated sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-80">AI Lifestyle Coach</p>
                  <h1 className="mt-1 text-xl font-bold sm:text-2xl">Сәлем, бүгінгі жоспар дайын 👋</h1>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Калория" value={`${plan.calories}`} unit="ккал" icon="🔥" />
                <StatCard label="Ақуыз" value={`${plan.proteinG}`} unit="г" icon="🥩" />
                <StatCard label="Су" value={`${plan.waterLiters}`} unit="л" icon="💧" />
                <StatCard label="Streak" value={`${streak}`} unit="күн" icon="🔥" />
              </div>
            </div>

            {/* Today's workout */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold">
                  <span className="text-lg">{dayEmojis[currentDayWorkout.day] || "💪"}</span>
                  Бүгін: {currentDayWorkout.day}
                </h2>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${intensityColors[currentDayWorkout.intensity]}`}>
                  {currentDayWorkout.intensity === "light" ? "Жеңіл" : currentDayWorkout.intensity === "moderate" ? "Орташа" : "Қарқынды"}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-primary">{currentDayWorkout.focus}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{currentDayWorkout.details}</p>
              <Button onClick={() => setActiveSection("tracking")} variant="outline" className="mt-4 h-10 rounded-xl text-sm">
                Check-in жасау <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {/* Quick check-in progress */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Бүгінгі прогресс</h2>
                <span className="text-2xl font-bold text-primary">{completedCount}/4</span>
              </div>
              <Progress value={completedCount * 25} className="mt-3 h-3 rounded-full" />
              <div className="mt-4 grid grid-cols-4 gap-2">
                {(["workout", "water", "meals", "sleep"] as const).map((key) => {
                  const labels = { workout: "💪", water: "💧", meals: "🍽️", sleep: "🌙" };
                  return (
                    <button
                      key={key}
                      onClick={() => setCheckIn((c) => ({ ...c, [key]: !c[key] }))}
                      className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-xs transition-all ${
                        checkIn[key]
                          ? "bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      <span className="text-xl">{labels[key]}</span>
                      <span className="font-medium">{checkIn[key] ? "✓" : ""}</span>
                    </button>
                  );
                })}
              </div>
              {completedCount > 0 && (
                <Button onClick={saveCheckIn} className="mt-4 h-10 w-full rounded-xl gradient-medical text-primary-foreground text-sm">
                  <Send className="mr-2 h-4 w-4" /> Check-in жіберу
                </Button>
              )}
            </div>

            {/* Health metrics: BMI, BMR, TDEE */}
            <HealthMetricsCard plan={plan} />

            {/* Goal progress */}
            <GoalProgressCard plan={plan} currentWeight={lastWeight ?? numericProfile.weightKg} />

            {/* Charts row */}
            <div className="grid gap-4 lg:grid-cols-2">
              <WeightChart data={recentWeights} target={plan.targetWeightKg} />
              <CheckInChart data={recentCheckIns} />
            </div>

            {/* Macro donut */}
            <MacroDonutCard plan={plan} />


            {/* Safety notes */}
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                <ShieldAlert className="h-4 w-4" /> Ескерту
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-700 dark:text-amber-300/80">
                {plan.safetyNotes.map((n) => <li key={n} className="flex gap-1.5"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{n}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* Profile form */}
        {activeSection === "profile" && (
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span className="text-xl">👤</span> Жеке параметрлер
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">AI осы деректер бойынша жеке жоспар құрады</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Жынысы">
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Әйел</SelectItem>
                    <SelectItem value="male">Ер</SelectItem>
                    <SelectItem value="other">Басқа</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Жасы"><Input value={age} onChange={(e) => setAge(e.target.value)} type="number" className="h-11 rounded-xl" /></Field>
              <Field label="Бойы, см"><Input value={heightCm} onChange={(e) => setHeightCm(e.target.value)} type="number" className="h-11 rounded-xl" /></Field>
              <Field label="Салмағы, кг"><Input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} type="number" className="h-11 rounded-xl" /></Field>
              <Field label="Белсенділік">
                <Select value={activityLevel} onValueChange={(v) => setActivityLevel(v as ActivityLevel)}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(activityLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Мақсат">
                <Select value={goal} onValueChange={(v) => setGoal(v as LifestyleGoal)}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(goalLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Аллергия"><Input value={allergies} onChange={(e) => setAllergies(e.target.value)} className="h-11 rounded-xl" placeholder="жаңғақ, сүт..." /></Field>
              <Field label="Қан қысымы">
                <Select value={bloodPressure} onValueChange={(v) => setBloodPressure(v as BloodPressure)}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(bloodPressureLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Button onClick={savePlan} disabled={loading} className="mt-6 h-11 rounded-xl gradient-medical px-6 text-primary-foreground">
              {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <><Save className="mr-2 h-4 w-4" /> Сақтау</>}
            </Button>
          </div>
        )}

        {/* Plan view */}
        {activeSection === "plan" && (
          <div className="space-y-4">
            {/* Macro overview */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><span className="text-xl">🍎</span> Тамақтану жоспары</h2>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Flame className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{plan.calories} <span className="text-base font-normal text-muted-foreground">ккал</span></p>
                  <p className="text-xs text-muted-foreground">Күнделікті калория нормасы</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MacroCard label="Ақуыз" value={plan.proteinG} color="bg-blue-500" percent={Math.round((plan.proteinG * 4 / plan.calories) * 100)} />
                <MacroCard label="Май" value={plan.fatG} color="bg-amber-500" percent={Math.round((plan.fatG * 9 / plan.calories) * 100)} />
                <MacroCard label="Көмірсу" value={plan.carbsG} color="bg-emerald-500" percent={Math.round((plan.carbsG * 4 / plan.calories) * 100)} />
              </div>
            </div>

            {/* Meals */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 font-semibold"><Utensils className="h-5 w-5 text-primary" /> Тамақтану режимі</h2>
              <div className="mt-4 space-y-3">
                {plan.meals.map((meal, i) => (
                  <div key={meal.title} className="rounded-2xl border border-border/60 p-4 transition-colors hover:bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{["🌅", "☀️", "🌤️", "🌆"][i]}</span>
                        <p className="font-medium">{meal.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{meal.calories} ккал</span>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{meal.time}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{meal.items.join(" • ")}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Workouts */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 font-semibold"><Dumbbell className="h-5 w-5 text-primary" /> Апталық жаттығу</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {plan.workouts.map((w) => {
                  const isToday = w.day === currentDayWorkout.day;
                  return (
                    <div key={w.day} className={`rounded-2xl border p-4 transition-all ${isToday ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10" : "border-border/60"}`}>
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-2 font-medium">
                          <span>{dayEmojis[w.day] || "💪"}</span> {w.day}
                          {isToday && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">БҮГІН</span>}
                        </p>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${intensityColors[w.intensity]}`}>
                          {w.intensity === "light" ? "Жеңіл" : w.intensity === "moderate" ? "Орташа" : "Қарқынды"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-primary">{w.focus}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{w.details}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tracking */}
        {activeSection === "tracking" && (
          <div className="space-y-4">
            {/* Check-in */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><span className="text-xl">🎯</span> Бүгінгі check-in</h2>
              <p className="mt-1 text-sm text-muted-foreground">Бүгін: {currentDayWorkout.focus}</p>
              <div className="mt-4 space-y-2.5">
                {([
                  { key: "workout" as const, label: "Жаттығу жасадым", emoji: "💪" },
                  { key: "water" as const, label: "Су нормасын ішіп жүрмін", emoji: "💧" },
                  { key: "meals" as const, label: "Тамақтану жоспарын ұстандым", emoji: "🍽️" },
                  { key: "sleep" as const, label: "Ұйқу режимін сақтадым", emoji: "🌙" },
                ]).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setCheckIn((c) => ({ ...c, [item.key]: !c[item.key] }))}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                      checkIn[item.key]
                        ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10"
                        : "border-border/60 hover:bg-secondary/30"
                    }`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                      checkIn[item.key] ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/30"
                    }`}>
                      {checkIn[item.key] && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                  </button>
                ))}
              </div>
              <Button onClick={saveCheckIn} className="mt-4 h-11 w-full rounded-xl gradient-medical text-primary-foreground">
                <Send className="mr-2 h-4 w-4" /> Check-in жіберу ({completedCount}/4)
              </Button>
            </div>

            {/* Weight tracker */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><span className="text-xl">⚖️</span> Салмақ</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-secondary/50 p-4 text-center">
                  <p className="text-2xl font-bold">{lastWeight || "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Қазіргі (кг)</p>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-4 text-center">
                  <p className={`flex items-center justify-center gap-1 text-2xl font-bold ${weightDelta < 0 ? "text-emerald-500" : weightDelta > 0 ? "text-rose-500" : ""}`}>
                    {weightDelta > 0 ? <TrendingUp className="h-5 w-5" /> : weightDelta < 0 ? <TrendingDown className="h-5 w-5" /> : null}
                    {weightDelta > 0 ? "+" : ""}{weightDelta}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Өзгеріс (кг)</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Input value={weightEntry} onChange={(e) => setWeightEntry(e.target.value)} type="number" className="h-11 rounded-xl" placeholder="Бүгінгі салмақ" />
                <Button onClick={saveWeight} className="h-11 rounded-xl gradient-medical text-primary-foreground"><Plus className="h-4 w-4" /></Button>
              </div>
              {recentWeights.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {recentWeights.slice(0, 7).map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{e.recorded_at}</span>
                      <span className="font-semibold">{e.weight_kg} кг</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent check-ins */}
            {recentCheckIns.length > 0 && (
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
                <h2 className="flex items-center gap-2 font-semibold"><Trophy className="h-5 w-5 text-primary" /> Соңғы check-in тарихы</h2>
                <div className="mt-3 space-y-2">
                  {recentCheckIns.map((c) => {
                    const done = [c.workout_done, c.water_done, c.meals_done, c.sleep_done].filter(Boolean).length;
                    return (
                      <div key={c.id} className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5 text-sm">
                        <span className="text-muted-foreground">{c.completed_at}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={done * 25} className="h-2 w-16 rounded-full" />
                          <span className="text-xs font-medium">{done}/4</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        {activeSection === "notifications" && (
          <div className="space-y-4">
            {/* Telegram Feature Card */}
            <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-[hsl(var(--primary)/0.05)] to-card p-5 shadow-card overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#229ED9]/10">
                    <Send className="h-6 w-6 text-[#229ED9]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Telegram Bot</h2>
                    <p className="text-xs text-muted-foreground">AI ассистент Telegram-да</p>
                  </div>
                  <Switch
                    checked={reminderChannels.telegram}
                    onCheckedChange={(v) => handleTelegramToggle(v)}
                    className="ml-auto"
                  />
                </div>

                {reminderChannels.telegram && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    {telegramChatId ? (
                      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Telegram қосылған!</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Хабарламалар жіберіледі</p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-background/60 p-2.5 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Командалар</p>
                            <p className="text-lg font-bold mt-0.5">8+</p>
                          </div>
                          <div className="rounded-xl bg-background/60 p-2.5 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Мини қосымша</p>
                            <p className="text-lg font-bold mt-0.5">✅</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Steps */}
                        <div className="space-y-3">
                          <StepItem number={1} title="Кодты көшіріңіз" active />
                          <div className="ml-8 rounded-2xl bg-secondary/60 border border-border/50 p-3">
                            <div className="flex gap-2 items-center">
                              <div className="flex-1 rounded-xl bg-background px-4 py-2.5 text-center font-mono text-lg tracking-[0.3em] font-bold text-primary select-all">
                                {telegramLinkCode || "..."}
                              </div>
                              <Button variant="outline" onClick={copyTelegramLinkCode} size="sm" className="h-10 w-10 rounded-xl shrink-0 p-0">
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 text-center">⏱️ Бір реттік код — қолданғаннан кейін жойылады</p>
                          </div>

                          <StepItem number={2} title="Telegram ботқа жіберіңіз" />
                          <div className="ml-8">
                            <Button asChild className="h-12 w-full rounded-2xl bg-[#229ED9] hover:bg-[#1a8ec5] text-white font-semibold shadow-lg shadow-[#229ED9]/20">
                              <a href={`${botUrl}?start=${telegramLinkCode || ""}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5">
                                <Send className="h-5 w-5" />
                                AIZHAN Bot-ты ашу
                                <ExternalLink className="h-4 w-4 ml-auto opacity-60" />
                              </a>
                            </Button>
                          </div>

                          <StepItem number={3} title="Автоматты байланысу" />
                          <p className="ml-8 text-xs text-muted-foreground">Код жіберілген соң аккаунтыңыз автоматты қосылады.</p>
                        </div>

                        {/* Bot features preview */}
                        <div className="rounded-2xl bg-secondary/40 border border-border/50 p-4">
                          <p className="text-xs font-semibold mb-2.5 text-muted-foreground uppercase tracking-wider">Бот мүмкіндіктері</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { emoji: "📋", label: "Жеке жоспар" },
                              { emoji: "✅", label: "Check-in" },
                              { emoji: "⚖️", label: "Салмақ бақылау" },
                              { emoji: "🔔", label: "Ескертулер" },
                              { emoji: "🎯", label: "Мақсат ауыстыру" },
                              { emoji: "🌐", label: "Мини қосымша" },
                            ].map((f) => (
                              <div key={f.label} className="flex items-center gap-2 rounded-xl bg-background/60 px-3 py-2 text-xs">
                                <span>{f.emoji}</span>
                                <span className="font-medium">{f.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Other channels */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><span className="text-xl">🔔</span> Хабарлама арналары</h2>
              <div className="mt-4 space-y-3">
                <ToggleRow label="📱 Сайт ішіндегі хабарламалар" checked={reminderChannels.in_app} onChange={(v) => setReminderChannels((c) => ({ ...c, in_app: v }))} />
                <ToggleRow label="🔔 Браузерлік push" checked={reminderChannels.browser} onChange={(v) => v ? requestBrowserNotifications() : setReminderChannels((c) => ({ ...c, browser: false }))} />
              </div>
            </div>

            {/* Reminder times */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 font-semibold"><span className="text-lg">⏰</span> Ескерту уақыттары</h2>
              <div className="mt-4 space-y-2.5">
                {reminderTypes.map((item) => (
                  <div key={item.key} className="flex items-center gap-3 rounded-2xl border border-border/60 p-3">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <Input value={reminderTimes[item.key]} onChange={(e) => setReminderTimes((c) => ({ ...c, [item.key]: e.target.value }))} type="time" className="h-9 w-[100px] rounded-xl text-xs" />
                    <Switch checked={reminders[item.key]} onCheckedChange={(v) => setReminders((c) => ({ ...c, [item.key]: v }))} />
                  </div>
                ))}
              </div>
              <Button onClick={savePlan} disabled={loading} className="mt-5 h-11 w-full rounded-xl gradient-medical text-primary-foreground">
                <Save className="mr-2 h-4 w-4" /> Ескертулерді сақтау
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Sub-components
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium">{label}</span>
    {children}
  </label>
);

const StatCard = ({ label, value, unit, icon }: { label: string; value: string; unit: string; icon: string }) => (
  <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-3">
    <p className="text-xs opacity-70">{icon} {label}</p>
    <p className="mt-1 text-lg font-bold">{value} <span className="text-sm font-normal opacity-70">{unit}</span></p>
  </div>
);

const MacroCard = ({ label, value, color, percent }: { label: string; value: number; color: string; percent: number }) => (
  <div className="rounded-2xl bg-secondary/50 p-3 text-center">
    <p className="text-xl font-bold">{value}<span className="text-sm font-normal text-muted-foreground">г</span></p>
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="mx-auto mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
    <p className="mt-1 text-[10px] text-muted-foreground">{percent}%</p>
  </div>
);

const ToggleRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 p-3">
    <span className="text-sm font-medium">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const StepItem = ({ number, title, active }: { number: number; title: string; active?: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
      {number}
    </div>
    <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{title}</span>
  </div>
);


export default LifestylePage;
