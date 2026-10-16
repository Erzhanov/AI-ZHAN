import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  HeartPulse,
  Lock,
  Scale,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  {
    icon: FileText,
    title: "1. Қызметтің мақсаты",
    text: "AIZHAN — денсаулық, психология, тамақтану және фитнес бойынша ақпараттық көмек беретін AI платформа. Сервис дәрігердің қабылдауын, диагноз қоюды немесе ем тағайындауды алмастырмайды.",
  },
  {
    icon: ShieldCheck,
    title: "2. AI жауаптарының шектеуі",
    text: "Жүйе берген жауаптар жалпы түсіндірме және бағыт-бағдар ретінде ұсынылады. Денсаулыққа қатысты нақты шешімдер қабылдар алдында міндетті түрде білікті медицина маманымен кеңесу қажет.",
  },
  {
    icon: HeartPulse,
    title: "3. Шұғыл жағдайлар",
    text: "Егер сізде кеуде тұсының ауыруы, тыныстың тарылуы, есінен тану, қатты әлсіздік немесе басқа қауіпті белгілер болса, платформаны күтпей, дереу жедел медициналық көмекке жүгініңіз.",
  },
  {
    icon: Lock,
    title: "4. Жеке деректер",
    text: "Платформа профиль деректері, чат тарихы және қолдану белсенділігі сияқты шектеулі ақпаратты қызмет сапасын жақсарту және қауіпсіздікті сақтау мақсатында өңдеуі мүмкін. Мәліметтер қорғалған ортада сақталады.",
  },
  {
    icon: Scale,
    title: "5. Пайдаланушы жауапкершілігі",
    text: "Қолданушы сервиске енгізетін мәліметтердің дұрыстығына өзі жауап береді. AI ұсынған ақпаратты тексермей тұрып медициналық әрекет жасау ұсынылмайды.",
  },
  {
    icon: AlertTriangle,
    title: "6. Қызметті өзгерту құқығы",
    text: "AIZHAN платформасы функционалдарды жаңартуға, өзгертуге немесе кей бөлімдерді уақытша шектеуге құқылы. Маңызды өзгерістер болған жағдайда пайдаланушыға қолданба ішінде хабар берілуі мүмкін.",
  },
];

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />
        <div className="bg-grid-soft h-full w-full" />
      </div>

      <header className="border-b border-white/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-medical shadow-elevated">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">AIZHAN</p>
              <p className="text-xs text-muted-foreground">Пайдалану шарттары</p>
            </div>
          </div>

          <Link to="/">
            <Button variant="outline" className="rounded-full border-primary/20 bg-white/70 dark:bg-slate-900/80">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Басты бетке қайту
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-[36px] border border-border/70 bg-white/85 p-8 shadow-elevated backdrop-blur-sm dark:bg-slate-900/85 sm:p-10">
          <p className="eyebrow">Құқықтық ақпарат</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Пайдалану шарттары
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
            Бұл бет AIZHAN платформасын қолдану кезіндегі негізгі ережелерді, қауіпсіздік
            шекараларын және пайдаланушының құқықтары мен міндеттерін қысқа әрі түсінікті түрде
            түсіндіреді.
          </p>
        </div>

        <div className="mt-8 grid gap-5">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <section
                key={section.title}
                className="rounded-[28px] border border-border/70 bg-white p-6 shadow-card dark:bg-slate-900 sm:p-7"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                      {section.text}
                    </p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-8 rounded-[32px] bg-slate-950 px-8 py-8 text-white shadow-elevated sm:px-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Шарттарды қабылдау нені білдіреді?
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
            Платформаны қолдану арқылы сіз осы шарттармен танысқаныңызды және AI жүйесінің
            медициналық маманды алмастырмайтынын түсінетініңізді растайсыз. Егер бұл шарттармен
            келіспесеңіз, сервисті пайдалануды тоқтатқан дұрыс.
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link to="/login">
              <Button className="rounded-full bg-white px-6 text-slate-950 hover:bg-white/90">
                Жүйеге өту
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="rounded-full border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">
                Басты бетке оралу
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TermsPage;

