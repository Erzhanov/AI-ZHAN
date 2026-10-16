import { Link } from "react-router-dom";
import {
  Activity,
  Apple,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Heart,
  Lock,
  MessageCircle,
  PhoneCall,
  Pill,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const highlights = [
  "24/7 AI көмекші",
  "ҚР 1187 Клиникалық хаттамасы",
  "Қазақ тіліндегі интерфейс",
];

const stats = [
  { value: "1187", label: "ҚР ДСМ ресми клиникалық хаттамалары (MedElement)" },
  { value: "24/7", label: "Кез келген уақытта жауап алуға болады" },
  { value: "1 платформа", label: "Чат, дәрі анықтамалығы және жеке кабинет бірге" },
  { value: "100%", label: "Қауіпсіздік ережелері мен нақтылау сүзгісі" },
];

const features = [
  {
    icon: Brain,
    title: "AI денсаулық көмекшісі",
    desc: "Күнделікті сұрақтар, симптомдарды түсіну, алдын алу және өмір салтын жақсарту бойынша бағыт береді.",
  },
  {
    icon: Pill,
    title: "Дәрі анықтамалығы",
    desc: "Дәрілердің қолданылуы, сақтық шаралары және жалпы сипаттамасы туралы жылдам ақпарат ұсынады.",
  },
  {
    icon: MessageCircle,
    title: "Қарапайым чат тәжірибесі",
    desc: "Адамға түсінікті, қысқа әрі нақты диалог форматы қолданушыға тез бейімделуге көмектеседі.",
  },
  {
    icon: ShieldCheck,
    title: "Жауапты қолдану",
    desc: "Платформа AI кеңесінің шектеулерін ашық көрсетіп, дәрігерге жүгіну қажет сәттерді ескертеді.",
  },
  {
    icon: Lock,
    title: "Дерек қауіпсіздігі",
    desc: "Профиль, чат және келісімге қатысты мәліметтер қорғалған ортада сақталады.",
  },
  {
    icon: Sparkles,
    title: "Қазақша цифрлық тәжірибе",
    desc: "Жергілікті аудиторияға жақын тіл, жұмсақ визуал және сенімді интерфейс арқылы қызмет көрсетеді.",
  },
];

const journeys = [
  {
    step: "01",
    title: "Сұрағыңызды қоясыз",
    desc: "Симптом, көңіл күй, дәрі немесе күн тәртібі туралы еркін форматта жаза аласыз.",
  },
  {
    step: "02",
    title: "AI құрылымды жауап береді",
    desc: "Жүйе мәселені бөліп түсіндіріп, қандай қадамдар қауіпсіз екенін көрсетеді.",
  },
  {
    step: "03",
    title: "Қажет болса маманға бағыттайды",
    desc: "Шұғыл немесе күрделі жағдайларда дәрігерге қаралу қажеттігін айқын ескертеді.",
  },
];

const categories = [
  {
    icon: Activity,
    title: "Денсаулық сауаттылығы",
    items: ["Симптомды түсіну", "Алдын алу әдеттері", "Күнделікті бақылау"],
  },
  {
    icon: Apple,
    title: "Тамақтану",
    items: ["Рацион идеялары", "Су ішу тәртібі", "Жеңіл пайдалы кеңестер"],
  },
  {
    icon: Dumbbell,
    title: "Фитнес",
    items: ["Бастапқы жаттығулар", "Қалпына келу тәртібі", "Қозғалыс мотивациясы"],
  },
  {
    icon: Heart,
    title: "Психологиялық қолдау",
    items: ["Күйзелісті басқару", "Эмоцияны түсіну", "Жұмсақ мотивация"],
  },
];

const trustPoints = [
  {
    icon: Shield,
    title: "AI диагноз қоймайды",
    desc: "Жауаптар тек ақпараттық және бағыттаушы сипатта беріледі.",
  },
  {
    icon: PhoneCall,
    title: "Шұғыл жағдайда кешіктірмеңіз",
    desc: "Кеуде ауыруы, тыныс тарылуы немесе ауыр белгілер болса, бірден жедел көмекке жүгініңіз.",
  },
  {
    icon: BookOpen,
    title: "Түсінікті тіл",
    desc: "Күрделі медициналық терминдердің орнына қарапайым, оқуға жеңіл мәтіндер қолданылады.",
  },
  {
    icon: Users,
    title: "Адамды алмастырмайды",
    desc: "Платформа дәрігердің, психологтың немесе фармацевтің орнын баспайды.",
  },
];

const testimonials = [
  {
    quote: "Басты бет әлдеқайда сенімді көрінеді. Қызметтің не үшін керек екенін бірден түсінуге болады.",
    author: "Студент қолданушы",
  },
  {
    quote: "Дәрі туралы қысқа анықтама мен чат бөлімі бірге тұрғаны өте ыңғайлы шешім болды.",
    author: "Жас ана",
  },
  {
    quote: "Қазақ тіліндегі медициналық интерфейстің осылай таза және заманауи көрінуі ерекше ұнады.",
    author: "Күнделікті қолданушы",
  },
];

const faq = [
  {
    q: "AIZHAN нақты диагноз қоя ма?",
    a: "Жоқ. Платформа тек ақпараттық көмек береді және диагнозды тек медицина маманы қоя алады.",
  },
  {
    q: "Қандай тақырыптар бойынша сұрақ қоюға болады?",
    a: "Денсаулық, психология, тамақтану, фитнес және дәрілер туралы жалпы сұрақтар қоюға болады.",
  },
  {
    q: "Бұл сервис кімдерге пайдалы?",
    a: "Өзіне немесе отбасысына қатысты денсаулық сауаттылығын арттырғысы келетін кез келген қолданушыға пайдалы.",
  },
  {
    q: "Деректерім қорғала ма?",
    a: "Иә, платформада қауіпсіздік пен келісім шарттарына ерекше назар аударылған.",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/50 bg-background/80 backdrop-blur-xl dark:border-border/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-medical shadow-elevated">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">AIZHAN</p>
              <p className="text-xs text-muted-foreground">AI арқылы жұмыс істейтін қазақша медициналық көмекші</p>
            </div>
          </div>

          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Мүмкіндіктер</a>
            <a href="#journey" className="transition-colors hover:text-foreground">Қалай жұмыс істейді</a>
            <a href="#trust" className="transition-colors hover:text-foreground">Қауіпсіздік</a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="outline" className="hidden rounded-full border-primary/20 bg-white/70 md:inline-flex dark:bg-slate-900/80">
                Кіру
              </Button>
            </Link>
            <Link to="/login">
              <Button className="rounded-full px-5 gradient-medical text-primary-foreground shadow-elevated">
                Бастау
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-24 lg:pt-16">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-sm text-foreground shadow-card backdrop-blur-sm dark:border-border/80 dark:bg-slate-900/85 dark:text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Сенімді, түсінікті және заманауи қазақша денсаулық платформасы
            </div>

            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Денсаулық туралы
              <span className="text-gradient"> ақпаратты </span>
              түсінікті тілде беретін жаңа буын басты бет
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              AIZHAN қолданушыға денсаулық, психология, тамақтану және фитнес бағыттарында
              қолжетімді түсіндірме береді. Бұл бетте сервис не ұсынатыны, қалай жұмыс істейтіні,
              қандай шектеулері бар екені және не үшін сенім ұялататыны анық көрсетілген.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/85 px-4 py-2 text-sm text-foreground shadow-card dark:bg-slate-900/85"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link to="/login">
                <Button size="lg" className="w-full rounded-full px-8 gradient-medical text-primary-foreground shadow-elevated sm:w-auto">
                  Қазір пайдаланып көру
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/terms" className="sm:w-auto">
                <Button size="lg" variant="outline" className="w-full rounded-full border-primary/20 bg-white/70 px-8 sm:w-auto dark:bg-slate-900/80">
                  Пайдалану шарттары
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="glass-panel overflow-hidden rounded-[32px] border border-white/70 p-5 shadow-elevated sm:p-6">
              <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Платформа көрінісі</p>
                    <h2 className="mt-1 text-2xl font-semibold">Сізге бағыт беретін цифрлық көмекші</h2>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Brain className="h-6 w-6 text-emerald-300" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-white/60">AI чат</p>
                        <p className="font-medium">Жылдам, құрылымды жауап</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-white/70">
                      Сұрақтарды қарапайым тілде қабылдайды және келесі қадамдарды түсінуге көмектеседі.
                    </p>
                  </div>

                  <div className="rounded-3xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/10 p-4">
                    <p className="text-sm text-white/70">Қауіпсіздік ескертуі</p>
                    <p className="mt-2 text-lg font-semibold">AI дәрігердің орнын алмастырмайды</p>
                    <p className="mt-3 text-sm leading-6 text-white/70">
                      Күрделі немесе жедел жағдайда қолданушы маманға уақыт жоғалтпай жүгінуі керек.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl bg-white/5 p-4">
                    <Clock3 className="h-5 w-5 text-cyan-300" />
                    <p className="mt-3 text-2xl font-semibold">24/7</p>
                    <p className="text-sm text-white/60">Қолжетімділік</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4">
                    <Shield className="h-5 w-5 text-cyan-300" />
                    <p className="mt-3 text-2xl font-semibold">Ашық</p>
                    <p className="text-sm text-white/60">Шектеу саясаты</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4">
                    <Pill className="h-5 w-5 text-cyan-300" />
                    <p className="mt-3 text-2xl font-semibold">Дәрі</p>
                    <p className="text-sm text-white/60">Анықтамалық бөлім</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[28px] border border-border/70 bg-white/85 p-6 shadow-card backdrop-blur-sm dark:bg-slate-900/85">
                <p className="font-display text-3xl font-semibold text-foreground">{stat.value}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="section-shell mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="eyebrow">Мүмкіндіктер</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Басты бет енді тек әдемі емес, мазмұн жағынан да әлдеқайда бай
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Пайдаланушы бір экранның ішінде сервис құндылығын, негізгі функцияларын, қауіпсіздік
              логикасын және қай кезде қолдану керек екенін түсіне алады.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.title} className="rounded-[28px] border border-border/70 bg-white p-6 shadow-card transition-transform duration-300 hover:-translate-y-1 dark:bg-slate-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="journey" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="eyebrow">Қалай жұмыс істейді</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Қолданушы жолы барынша түсінікті және сенімді болып құрылды
              </h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                Бұл бөлім жаңа келушіге платформаның логикасын бірнеше секундта түсінуге көмектеседі.
                Әсіресе денсаулыққа қатысты өнімдерде осындай айқындық өте маңызды.
              </p>
            </div>

            <div className="grid gap-4">
              {journeys.map((item) => (
                <div key={item.step} className="flex gap-4 rounded-[28px] border border-border/70 bg-white/90 p-6 shadow-card dark:bg-slate-900/90">
                  <div className="font-display text-3xl font-semibold text-primary/70">{item.step}</div>
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[32px] bg-slate-950 p-8 text-white shadow-elevated">
              <p className="eyebrow border-white/10 bg-white/5 text-white/70">Қамтитын бағыттар</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                Бір платформада бірнеше маңызды өмір салты категориясы
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
                Басты бетте тек батырма ғана емес, нақты қандай тақырыптарға жауап берілетіні де
                көрсетілді. Бұл өнімнің шекарасын да, құндылығын да ашып береді.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((category) => {
                const Icon = category.icon;

                return (
                  <div key={category.title} className="rounded-[28px] border border-border/70 bg-white p-6 shadow-card dark:bg-slate-900">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{category.title}</h3>
                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                      {category.items.map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="trust" className="section-shell mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="eyebrow">Қауіпсіздік және сенім</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Денсаулық тақырыбындағы өнім үшін жауапкершілік бөлігі алдыңғы қатарға шығарылды
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Бұл секция пайдаланушыға өнімнің ашық ұстанымын көрсетеді: AI көмектеседі, бірақ
              кәсіби медициналық шешімнің орнына жүрмейді.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {trustPoints.map((point) => {
              const Icon = point.icon;

              return (
                <div key={point.title} className="rounded-[28px] border border-border/70 bg-white p-6 shadow-card dark:bg-slate-900">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{point.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{point.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.author} className="rounded-[28px] border border-border/70 bg-white p-6 shadow-card dark:bg-slate-900">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <p className="mt-5 text-sm leading-7 text-foreground/85">“{item.quote}”</p>
                <p className="mt-5 text-sm font-medium text-muted-foreground">{item.author}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[36px] bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-8 shadow-card dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:p-10">
            <div className="max-w-3xl">
              <p className="eyebrow">Жиі қойылатын сұрақтар</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Қолданушы шешім қабылдамай тұрып білуі тиіс негізгі ақпараттар
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {faq.map((item) => (
                <div key={item.q} className="rounded-[24px] border border-white bg-white/90 p-5 shadow-card dark:border-border/80 dark:bg-slate-900/90">
                  <h3 className="text-lg font-semibold">{item.q}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
          <div className="rounded-[36px] bg-slate-950 px-8 py-10 text-white shadow-elevated sm:px-10 sm:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow border-white/10 bg-white/5 text-white/70">Қорытынды</p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Басты бет енді өнімді сенімді таныстыратын толыққанды презентацияға айналды
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">
                  Пайдаланушы енді сервис артықшылығын, мүмкіндігін, жауапкершілік шекарасын және
                  әрекетке шақыруды бірізді, заманауи құрылымда көреді.
                </p>
              </div>

              <Link to="/login">
                <Button size="lg" className="rounded-full bg-white px-8 text-slate-950 hover:bg-white/90">
                  Жүйеге өту
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-white/70 backdrop-blur-sm dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-medical">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold">AIZHAN</p>
              <p className="text-sm text-muted-foreground">Денсаулыққа арналған қазақша AI платформа</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">Мүмкіндіктер</a>
            <a href="#trust" className="transition-colors hover:text-foreground">Қауіпсіздік</a>
            <Link to="/terms" className="transition-colors hover:text-foreground">Келісім шарт</Link>
            <Link to="/login" className="transition-colors hover:text-foreground">Кіру / тіркелу</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

