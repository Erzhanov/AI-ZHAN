import { useEffect, useState } from "react";
import { Crown, Gift, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProStatus } from "@/hooks/use-pro-status";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_PREFIX = "aizhan_welcome_pro_shown_";

export const WelcomeProDialog = () => {
  const { user } = useAuth();
  const { isPro, proExpiresAt, loading } = useProStatus();
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || loading || !isPro || !proExpiresAt) return;
    const key = `${STORAGE_PREFIX}${user.id}`;
    try {
      if (localStorage.getItem(key)) return;
      const parsedTime = new Date(proExpiresAt).getTime();
      if (isNaN(parsedTime)) return;
      // Only show for users still inside the welcome window (<= 3 days remaining)
      const diffMs = parsedTime - Date.now();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      if (diffMs > 0 && diffMs <= threeDaysMs + 60_000) {
        setOpen(true);
      }
    } catch {
      // Ignore storage/date errors
    }
  }, [user, isPro, proExpiresAt, loading]);

  const handleClose = () => {
    try {
      if (user) localStorage.setItem(`${STORAGE_PREFIX}${user.id}`, "1");
    } catch {
      // Ignore storage errors
    }
    setOpen(false);
  };

  const expiresLabel = proExpiresAt
    ? (() => {
        try {
          const d = new Date(proExpiresAt);
          if (isNaN(d.getTime())) return "";
          return d.toLocaleDateString(lang === "kk" ? "kk-KZ" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch {
          return "";
        }
      })()
    : "";

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : setOpen(true))}>
      <DialogContent className="overflow-hidden rounded-3xl border-amber-200/60 p-0 sm:max-w-md">
        <div className="relative bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 px-6 pb-6 pt-8 text-white">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Gift className="h-8 w-8" />
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide backdrop-blur">
              <Crown className="h-3.5 w-3.5" />
              {t("welcome.badge")}
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold leading-tight">
              {t("welcome.title")}
            </h2>
            <p className="mt-2 text-sm text-white/90">{t("welcome.subtitle")}</p>
          </div>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-5">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="sr-only">{t("welcome.title")}</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              {t("welcome.desc")}
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>{t("welcome.bullet1")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>{t("welcome.bullet2")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>{t("welcome.bullet3")}</span>
            </li>
          </ul>

          {expiresLabel && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <span className="font-semibold">{t("welcome.until")}:</span> {expiresLabel}
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleClose} className="h-11 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-base font-semibold text-white hover:from-amber-600 hover:to-orange-600">
              {t("welcome.cta")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeProDialog;
