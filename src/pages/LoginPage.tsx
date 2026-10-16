import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stethoscope, Mail, Lock, ArrowRight, Heart, Brain, Shield, Phone, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const highlights = [
  "Жылдам кіру немесе тіркелу",
  "Қазақ тіліндегі түсінікті интерфейс",
  "Тіркелгеннен кейін бірден кіру",
];

const benefits = [
  { icon: Brain, title: "AI кеңес", desc: "Денсаулыққа қатысты сұрақтарға құрылымды жауап береді." },
  { icon: Heart, title: "Жеке тәжірибе", desc: "Психология, фитнес және күнделікті әл-ауқат тақырыптарын қамтиды." },
  { icon: Shield, title: "Қауіпсіздік", desc: "Пайдаланушы жолы түсінікті және жауапты логикамен құрылған." },
];

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: "Қате", description: "Аты-жөніңізді толтырыңыз", variant: "destructive" });
      return;
    }

    if (!phone || phone.length < 10) {
      toast({ title: "Қате", description: "Телефон нөмірін дұрыс толтырыңыз. Мысалы: +77001234567", variant: "destructive" });
      return;
    }

    if (!email || !password || password.length < 6) {
      toast({ title: "Қате", description: "Email мен құпия сөзді дұрыс толтырыңыз. Құпия сөз кемінде 6 таңба болуы керек.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await signUp(email, password, name);
      if (signUpError) {
        toast({ title: "Тіркелу қатесі", description: signUpError, variant: "destructive" });
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          toast({
            title: "Тіркелу сәтті",
            description: "Аккаунт ашылды, бірақ автоматты кіру болмады. Email және құпия сөзбен кіріңіз.",
          });
          setIsLogin(true);
          setLoading(false);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("profiles").update({ phone } as never).eq("user_id", user.id);
        }

        toast({ title: "Тіркелу сәтті", description: "Аккаунтыңызға бірден кірдіңіз." });
        navigate("/chat");
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast({ title: "Қате", description: err?.message || "Белгісіз қате", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Қате", description: "Email мен құпия сөзді толтырыңыз", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Кіру қатесі", description: error, variant: "destructive" });
    } else {
      toast({ title: "Қош келдіңіз", description: "Сіз жүйеге сәтті кірдіңіз." });
      navigate("/chat");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden">
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />
        <div className="bg-grid-soft h-full w-full" />
      </div>

      <div className="mx-auto grid min-h-screen max-w-7xl gap-4 px-3 py-4 sm:gap-8 sm:px-6 sm:py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-10">
        <section className="hidden flex-col justify-between rounded-[36px] bg-slate-950 p-6 text-white shadow-elevated reveal-up sm:p-8 lg:flex lg:p-10">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-2xl font-semibold">AIZHAN</p>
                <p className="text-sm text-white/65">Қазақша AI денсаулық платформасы</p>
              </div>
            </Link>

            <div className="mt-8 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                Бір жүйеде чат, анықтама және жеке профиль
              </div>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Кіру және тіркелу процесін де заманауи әрі ыңғайлы қылып жаңарттық
              </h1>
              <p className="mt-5 text-base leading-8 text-white/72 sm:text-lg">
                Интерфейс енді экран өлшеміне жақсы бейімделеді, негізгі әрекеттер бірден көрінеді,
                ал мобильді қолданушы үшін форма құрылымы әлдеқайда ыңғайлы болды.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {highlights.map((item) => (
                <div key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {benefits.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={`rounded-[24px] bg-white/6 p-4 reveal-up delay-${index + 1}`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/68">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass-panel reveal-up delay-1 flex items-center rounded-[28px] border border-border/70 p-3 shadow-elevated sm:rounded-[36px] sm:p-6 lg:p-8">
          <div className="w-full rounded-[22px] bg-card p-4 shadow-card sm:rounded-[28px] sm:p-8">
            <div className="mb-8 lg:hidden">
              <p className="font-display text-2xl font-semibold tracking-tight">AIZHAN</p>
              <p className="text-sm text-muted-foreground">Мобильді нұсқаға да ыңғайлы кіру беті</p>
            </div>

            <div className="reveal-up">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{isLogin ? "Қайта қош келдіңіз" : "Жаңа аккаунт ашу"}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                {isLogin
                  ? "Аккаунтыңызға кіріп, AI құралдарын бірден пайдалана бастаңыз."
                  : "Тіркелу бірнеше қарапайым қадамнан тұрады."}
              </p>

              <form onSubmit={isLogin ? handleLogin : handleSignup} className="mt-8 space-y-4">
                  {!isLogin && (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">Аты-жөні</label>
                        <Input placeholder="Атыңызды жазыңыз" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-2xl" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">Телефон нөмірі</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type="tel" placeholder="+77001234567" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-2xl pl-11" />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-2xl pl-11" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Құпия сөз</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="password" placeholder="Кемінде 6 таңба" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-2xl pl-11" />
                    </div>
                  </div>

                  <Button type="submit" className="h-12 w-full rounded-2xl gradient-medical text-base font-semibold text-primary-foreground" disabled={loading}>
                    {loading ? (
                      <div className="spinner-ring h-5 w-5" />
                    ) : (
                      <>
                        {isLogin ? "Кіру" : "Тіркелу"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {isLogin ? "Аккаунтыңыз жоқ па?" : "Аккаунтыңыз бар ма?"}{" "}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    {isLogin ? "Тіркелу" : "Кіру"}
                  </button>
                </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;

