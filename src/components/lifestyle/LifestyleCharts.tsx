import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CalendarCheck, Heart, Scale, Target, TrendingDown, TrendingUp } from "lucide-react";
import type { LifestylePlan } from "@/lib/lifestyle";

interface WeightPoint { weight_kg: number; recorded_at: string }
interface CheckInPoint { completed_at: string; workout_done: boolean; water_done: boolean; meals_done: boolean; sleep_done: boolean }

const bmiInfo = (cat: LifestylePlan["bmiCategory"]) => {
  switch (cat) {
    case "underweight": return { label: "Төмен салмақ", color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/30" };
    case "normal": return { label: "Қалыпты", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    case "overweight": return { label: "Артық салмақ", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" };
    case "obese": return { label: "Семіздік", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/30" };
  }
};

export const HealthMetricsCard = ({ plan }: { plan: LifestylePlan }) => {
  const info = bmiInfo(plan.bmiCategory);
  // BMI gauge: position from 15 to 35
  const pct = Math.min(100, Math.max(0, ((plan.bmi - 15) / 20) * 100));
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Денсаулық көрсеткіштері</h2>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="BMI" value={plan.bmi.toString()} hint={info.label} hintClass={info.color} />
        <Metric label="BMR" value={plan.bmr.toString()} hint="ккал/тыныш" />
        <Metric label="TDEE" value={plan.tdee.toString()} hint="ккал/күн" />
        <Metric label="Ұйқы" value={`${plan.sleepHours}ч`} hint="ұсыныс" />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>15</span><span>18.5</span><span>25</span><span>30</span><span>35+</span>
        </div>
        <div className="relative mt-1 h-3 overflow-hidden rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500">
          <div className="absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-md" style={{ left: `${pct}%` }} />
        </div>
        <p className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${info.bg} ${info.border} ${info.color}`}>
          BMI {plan.bmi} • {info.label}
        </p>
      </div>
    </div>
  );
};

export const GoalProgressCard = ({ plan, currentWeight }: { plan: LifestylePlan; currentWeight: number | undefined }) => {
  const start = currentWeight ?? 0;
  const target = plan.targetWeightKg;
  const diff = Number((target - start).toFixed(1));
  if (!currentWeight || plan.weeklyDeltaKg === 0 || Math.abs(diff) < 0.1) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
        <div className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /><h2 className="font-semibold">Мақсат</h2></div>
        <p className="mt-3 text-sm text-muted-foreground">Қазіргі формаңызды сақтау режимінде сізсіз. Үнемі check-in жасап, су нормасын сақтаңыз.</p>
      </div>
    );
  }
  const direction = diff < 0 ? "loss" : "gain";
  const ProgressIcon = direction === "loss" ? TrendingDown : TrendingUp;
  const dateLabel = plan.projectedGoalDate
    ? new Date(plan.projectedGoalDate).toLocaleDateString("kk-KZ", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Мақсатқа дейін</h2>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <GoalCell label="Қазір" value={`${start} кг`} />
        <GoalCell label="Мақсат" value={`${target} кг`} accent />
        <GoalCell label={direction === "loss" ? "Жоғалту" : "Қосу"} value={`${Math.abs(diff)} кг`} icon={ProgressIcon} />
      </div>
      <div className="mt-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-4">
        <p className="text-xs text-muted-foreground">Болжамды күн</p>
        <p className="mt-1 text-lg font-bold">{dateLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          ~{plan.weeksToGoal} апта • аптасына {plan.weeklyDeltaKg > 0 ? "+" : ""}{plan.weeklyDeltaKg} кг қарқынмен
        </p>
      </div>
    </div>
  );
};

export const WeightChart = ({ data, target }: { data: WeightPoint[]; target: number }) => {
  const chartData = useMemo(() => {
    if (!data.length) return [];
    return [...data].reverse().map((d) => ({
      date: new Date(d.recorded_at).toLocaleDateString("kk-KZ", { day: "2-digit", month: "2-digit" }),
      weight: Number(d.weight_kg),
    }));
  }, [data]);

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Салмақ динамикасы</h2>
      </div>
      {chartData.length < 2 ? (
        <div className="mt-6 flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-border/60 text-center text-sm text-muted-foreground">
          График пайда болуы үшін кем дегенде 2 өлшем жазыңыз 📊
        </div>
      ) : (
        <div className="mt-4 h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(v: number) => [`${v} кг`, "Салмақ"]}
              />
              <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#weightFill)" dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center text-xs text-muted-foreground">🎯 Мақсат: {target} кг</p>
        </div>
      )}
    </div>
  );
};

const dayShort = ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"];

export const CheckInChart = ({ data }: { data: CheckInPoint[] }) => {
  const chartData = useMemo(() => {
    // Build last 7 days, fill missing
    const map = new Map(data.map((d) => [d.completed_at.slice(0, 10), d]));
    const rows: { day: string; score: number; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(Date.now() - i * 86400_000);
      const iso = dt.toISOString().slice(0, 10);
      const entry = map.get(iso);
      const score = entry ? [entry.workout_done, entry.water_done, entry.meals_done, entry.sleep_done].filter(Boolean).length : 0;
      const dayIdx = dt.getDay() === 0 ? 6 : dt.getDay() - 1;
      rows.push({ day: dayShort[dayIdx], score, date: iso });
    }
    return rows;
  }, [data]);

  const weekTotal = chartData.reduce((a, b) => a + b.score, 0);
  const weekPercent = Math.round((weekTotal / (chartData.length * 4)) * 100);

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Аптаның дисциплинасы</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{weekPercent}%</p>
          <p className="text-[10px] text-muted-foreground">{weekTotal}/{chartData.length * 4} тапсырма</p>
        </div>
      </div>
      <div className="mt-4 h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => [`${v}/4`, "Орындалды"]}
            />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.score >= 3 ? "hsl(var(--primary))" : d.score >= 1 ? "hsl(var(--primary) / 0.5)" : "hsl(var(--muted) / 0.6)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const MacroDonutCard = ({ plan }: { plan: LifestylePlan }) => {
  const data = useMemo(() => [
    { name: "Ақуыз", value: plan.proteinG * 4, grams: plan.proteinG, color: "hsl(213 94% 60%)" },
    { name: "Май", value: plan.fatG * 9, grams: plan.fatG, color: "hsl(38 92% 55%)" },
    { name: "Көмірсу", value: plan.carbsG * 4, grams: plan.carbsG, color: "hsl(160 60% 45%)" },
  ], [plan]);
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Калория құрылымы</h2>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[150px] w-[150px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2} strokeWidth={0}>
                {data.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number, n: string) => [`${v} ккал`, n]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-bold">{plan.calories}</p>
            <p className="text-[10px] text-muted-foreground">ккал</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                {d.name}
              </span>
              <span className="font-medium">{d.grams}г</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Metric = ({ label, value, hint, hintClass }: { label: string; value: string; hint?: string; hintClass?: string }) => (
  <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3">
    <p className="text-[11px] text-muted-foreground">{label}</p>
    <p className="mt-1 text-lg font-bold">{value}</p>
    {hint && <p className={`text-[10px] ${hintClass || "text-muted-foreground"}`}>{hint}</p>}
  </div>
);

const GoalCell = ({ label, value, accent, icon: Icon }: { label: string; value: string; accent?: boolean; icon?: React.ElementType }) => (
  <div className={`rounded-2xl p-3 text-center ${accent ? "bg-primary/10 ring-1 ring-primary/20" : "bg-secondary/50"}`}>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={`mt-1 flex items-center justify-center gap-1 text-base font-bold ${accent ? "text-primary" : ""}`}>
      {Icon && <Icon className="h-4 w-4" />}
      {value}
    </p>
  </div>
);
