import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProStatus } from "@/hooks/use-pro-status";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_PREFIX = "aizhan_pro_expired_shown_";

export const ExpiredProDialog = () => {
  const { user } = useAuth();
  const { isPro, proExpiresAt, loading } = useProStatus();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || loading) return;
    if (isPro) return;
    if (!proExpiresAt) return;
    try {
      const expiredAt = new Date(proExpiresAt).getTime();
      if (isNaN(expiredAt) || expiredAt > Date.now()) return; // not expired yet or invalid
      const key = `${STORAGE_PREFIX}${user.id}_${proExpiresAt}`;
      if (localStorage.getItem(key)) return;
      setOpen(true);
    } catch {
      // Ignore storage/date errors
    }
  }, [user, isPro, proExpiresAt, loading]);

  const markShown = () => {
    try {
      if (user && proExpiresAt) {
        localStorage.setItem(`${STORAGE_PREFIX}${user.id}_${proExpiresAt}`, "1");
      }
    } catch {
      // Ignore storage errors
    }
  };

  const handleClose = () => {
    markShown();
    setOpen(false);
  };

  const handleGetPro = () => {
    markShown();
    setOpen(false);
    navigate("/pro");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : setOpen(true))}>
      <DialogContent className="overflow-hidden rounded-3xl p-0 sm:max-w-md">
        <div className="relative bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 px-6 pb-6 pt-8 text-white">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Clock className="h-8 w-8" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold leading-tight">
              {t("expired.title")}
            </h2>
            <p className="mt-2 text-sm text-white/80">{t("expired.subtitle")}</p>
          </div>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-5">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="sr-only">{t("expired.title")}</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              {t("expired.desc")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button onClick={handleGetPro} className="h-11 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-base font-semibold text-white hover:from-amber-600 hover:to-orange-600">
              <Crown className="mr-2 h-4 w-4" />
              {t("expired.cta")}
            </Button>
            <Button variant="ghost" onClick={handleClose} className="h-10 w-full rounded-2xl">
              {t("expired.later")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpiredProDialog;
