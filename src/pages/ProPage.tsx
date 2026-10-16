import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, Crown, ExternalLink, Infinity as InfinityIcon, MessageSquare, ShieldCheck, Sparkles, Zap } from "lucide-react";

type SubscriptionPlan = "free" | "pro";

const WHATSAPP_NUMBER = "77057812935";

const ProPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const benefits = [
    { title: t("pro.benefit1.title"), text: t("pro.benefit1.text"), icon: InfinityIcon },
    { title: t("pro.benefit2.title"), text: t("pro.benefit2.text"), icon: MessageSquare },
    { title: t("pro.benefit3.title"), text: t("pro.benefit3.text"), icon: Zap },
    { title: t("pro.benefit4.title"), text: t("pro.benefit4.text"), icon: ShieldCheck },
  ];

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const loadSubscription = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("subscription_plan, pro_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!isMounted) return;
      const expiresAt = data?.pro_expires_at ? new Date(data.pro_expires_at).getTime() : null;
      const activePro = data?.subscription_plan === "pro" && (!expiresAt || expiresAt > Date.now());
      setPlan(activePro ? "pro" : "free");
      setProExpiresAt(data?.pro_expires_at ?? null);
      setLoading(false);
    };
    void loadSubscription();
    return () => { isMounted = false; };
  }, [user]);

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Сәлем! Мен сайттан келдім маған PRO версиясы керек.");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  const expiresLabel = proExpiresAt
    ? new Date(proExpiresAt).toLocaleDateString("kk-KZ", { year: "numeric", month: "long", day: "numeric" })
    : t("pro.unlimited");

  return (
    <Layout>
      <div className="space-y-5 pb-8">
        <section className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-card">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                <Crown className="h-4 w-4" />
                {t("pro.badge")}
              </div>
              <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("pro.title")}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {t("pro.desc")}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {plan === "pro" ? (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    {t("pro.active")}: {expiresLabel} {t("pro.until")}
                  </div>
                ) : (
                  <Button onClick={handleWhatsApp} className="h-12 rounded-2xl bg-[#25D366] hover:bg-[#1fb855] px-6 text-base font-semibold text-white shadow-lg shadow-[#25D366]/20">
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    {t("pro.buy")}
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => window.location.assign("/chat")} className="h-12 rounded-2xl px-6">
                  {t("pro.go_chat")}
                </Button>
              </div>
            </div>

            <div className="border-t border-border/80 bg-secondary/40 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="rounded-3xl border border-border/70 bg-background p-5 shadow-card">
                <p className="text-sm text-muted-foreground">{t("pro.price_label")}</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="font-display text-4xl font-semibold">4990 тг</span>
                  <span className="pb-1 text-sm text-muted-foreground">{t("pro.per_month")}</span>
                </div>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {t("pro.check1")}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {t("pro.check2")}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {t("pro.check3")}
                  </div>
                </div>
                {!loading && plan !== "pro" && (
                  <Button onClick={handleWhatsApp} variant="outline" className="mt-5 h-11 w-full rounded-2xl">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("pro.whatsapp_btn")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article key={benefit.title} className="rounded-3xl border border-border/80 bg-card p-5 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="mt-4 text-base font-semibold">{benefit.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{benefit.text}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-border/80 bg-card p-5 shadow-card sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl gradient-medical">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t("pro.diff.title")}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{t("pro.diff.text")}</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ProPage;
