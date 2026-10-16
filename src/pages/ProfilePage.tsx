import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Calendar, Save, Shield, Sparkles, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useProStatus } from "@/hooks/use-pro-status";

const ProfilePage = () => {
  const { user } = useAuth();
  const { isPro, proExpiresAt } = useProStatus();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadProfile = async () => {
      setName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setBirthDate(typeof user.user_metadata?.birth_date === "string" ? user.user_metadata.birth_date : "");

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .single();

      if (!isMounted || error) return;

      setName(data.full_name || user.user_metadata?.full_name || "");
      setPhone(data.phone || user.phone || "");
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    const [{ error: profileError }, { error: authError }] = await Promise.all([
      supabase
        .from("profiles")
        .update({ full_name: trimmedName || null, phone: trimmedPhone || null })
        .eq("user_id", user.id),
      supabase.auth.updateUser({
        data: { full_name: trimmedName, birth_date: birthDate },
      }),
    ]);

    if (profileError || authError) {
      toast({
        title: "Қате",
        description: profileError?.message || authError?.message || "Профильді сақтау мүмкін болмады",
        variant: "destructive",
      });
    } else {
      setName(trimmedName);
      setPhone(trimmedPhone);
      setBirthDate(birthDate);
      toast({ title: "Сақталды", description: "Профиль деректері жаңартылды" });
    }

    setLoading(false);
  };

  return (
    <Layout>
      <div className="space-y-5 px-3 pb-24 pt-2 sm:px-6 lg:px-8 lg:space-y-6 md:pb-8">
        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="glass-panel reveal-up rounded-[32px] border border-white/70 p-6 shadow-card dark:border-border/80 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-sm shadow-card dark:bg-slate-900/80">
              <Sparkles className="h-4 w-4 text-primary" />
              Жеке кабинет
            </div>
            <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Профиль құрылымы жаңартылды</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Бұл бөлім енді мобильді экранда да ыңғайлы ашылады, ал негізгі деректер карточка түрінде жинақы көрсетіледі.
            </p>
          </div>

          <div className="rounded-[32px] bg-slate-950 p-6 text-white shadow-elevated reveal-up delay-1 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Shield className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="font-semibold">Қауіпсіздік</p>
                <p className="text-sm text-white/65">Маңызды деректерді бақылау</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/72">
              Бұл жерде өз атыңызды, туған күніңізді және байланыс деректеріңізді жаңарта аласыз. Email өрісі ақпараттық мақсатта ғана көрсетіледі.
            </p>
          </div>
        </section>

        <section className="reveal-up delay-2 rounded-[32px] border border-border/70 bg-white/90 p-5 shadow-card dark:bg-slate-900/90 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] gradient-medical shadow-elevated">
              <User className="h-10 w-10 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-semibold tracking-tight">{name || "Пайдаланушы"}</h2>
                {isPro && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <Crown className="h-3.5 w-3.5" />
                    PRO
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{email || "Email көрсетілмеген"}</p>
              {isPro && proExpiresAt && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Pro мерзімі: {new Date(proExpiresAt).toLocaleDateString("kk-KZ", { year: "numeric", month: "long", day: "numeric" })} дейін
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Аты-жөні</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-2xl pl-11" placeholder="Аты-жөніңіз" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={email} disabled className="h-12 rounded-2xl pl-11 opacity-65" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Телефон</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-2xl pl-11" placeholder="+7 700 123 45 67" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Туған күні</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="h-12 rounded-2xl pl-11" />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="mt-6 h-12 w-full rounded-2xl gradient-medical text-base font-semibold text-primary-foreground sm:w-auto sm:px-8">
            {loading ? <div className="spinner-ring h-5 w-5" /> : <><Save className="mr-2 h-4 w-4" /> Сақтау</>}
          </Button>
        </section>
      </div>
    </Layout>
  );
};

export default ProfilePage;

