import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export const LanguageSelectDialog = () => {
  const { user } = useAuth();
  const { lang, setLang, hasChosen, markChosen, t } = useLanguage();
  const [selected, setSelected] = useState<"kk" | "ru">(lang);
  const [hasInteracted, setHasInteracted] = useState(false);

  if (!user || hasChosen) return null;

  const handleSelect = (code: "kk" | "ru") => {
    setSelected(code);
    setHasInteracted(true);
  };

  const handleContinue = () => {
    setLang(selected);
    markChosen();
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-medical shadow-card">
            <Globe className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl">
            {selected === "kk" ? "Тілді таңдаңыз / Выберите язык" : "Выберите язык / Тілді таңдаңыз"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {selected === "kk"
              ? "Сайтты қай тілде жалғастырғыңыз келеді?"
              : "На каком языке продолжить работу с сайтом?"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          {(["kk", "ru"] as const).map((code) => {
            const active = selected === code;
            return (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/5 shadow-card"
                    : "border-border/80 hover:border-primary/50"
                }`}
              >
                <div className="text-2xl mb-1">{code === "kk" ? "🇰🇿" : "🇷🇺"}</div>
                <div className="text-sm font-semibold">
                  {code === "kk" ? "Қазақша" : "Русский"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {code === "kk" ? "Kazakh" : "Russian"}
                </div>
                {active && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <Button onClick={handleContinue} className="w-full gradient-medical text-primary-foreground">
          {t("langselect.continue")} →
        </Button>
      </DialogContent>
    </Dialog>
  );
};
