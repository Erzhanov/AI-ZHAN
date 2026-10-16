import { useState } from "react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Pill, AlertTriangle, Loader2, X } from "lucide-react";
import { streamChat } from "@/lib/ai-stream";
import { useToast } from "@/hooks/use-toast";
import ChatMessageContent from "@/components/ChatMessageContent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const popularMedicines = ["Парацетамол", "Ибупрофен", "Амоксициллин", "Лоратадин", "Омепразол", "Аспирин"];

const MedicinePage = () => {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { t } = useLanguage();

  const handleSearch = async (name?: string) => {
    const query = name || search;
    if (!query.trim()) return;
    if (name) setSearch(name);
    if (!user && !session?.access_token) {
      toast({ title: "Қате", description: "Алдымен аккаунтқа кіріңіз.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResult("");

    let content = "";
    try {
      await streamChat({
        messages: [{ role: "user", content: `${query} дәрісі туралы қысқа әрі түсінікті ақпарат бер.` }],
        mode: "medicine",
        accessToken: session.access_token,
        onDelta: (fullContent) => {
          content = fullContent;
          setResult(content);
        },
        onDone: () => {
          setIsLoading(false);
          if (user) {
            supabase.from("medicine_searches").insert({ user_id: user.id, query: query.trim() }).then(() => {});
          }
        },
        onError: (err) => {
          toast({ title: "Қате", description: err, variant: "destructive" });
          setIsLoading(false);
        },
      });
    } catch {
      toast({ title: "Қате", description: "AI қызметімен байланыс орнатылмады", variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 pb-16 md:pb-4">
        <section className="surface-soft rounded-3xl border border-border/80 p-4 ring-soft">
          <h1 className="text-lg font-semibold text-foreground">Дәрі іздеу</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Дәрі атауын жазыңыз. Жауап қысқа және түсінікті түрде беріледі.</p>
        </section>

        <section className="surface-soft rounded-3xl border border-border/80 p-4 ring-soft shadow-card">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Дәрі атауын жазыңыз (мысалы: Ибупрофен)"
                className="h-11 rounded-2xl border-border/80 bg-card pl-10 pr-9 text-base sm:text-sm shadow-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={!search.trim() || isLoading}
              className="h-11 rounded-2xl gradient-medical text-primary-foreground shadow-card active:scale-95 transition-transform"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Іздеу"}
            </Button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar py-1 px-0.5 sm:flex-wrap">
            {popularMedicines.map((med) => (
              <button
                key={med}
                onClick={() => {
                  setSearch(med);
                  handleSearch(med);
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:border-primary/50 hover:bg-secondary active:scale-95"
              >
                <Pill className="h-3 w-3 text-primary" />
                {med}
              </button>
            ))}
          </div>
        </section>

        {isLoading && (!result || result === "") ? (
          <section className="surface-soft rounded-3xl border border-border/80 p-6 ring-soft">
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl gradient-medical shadow-card">
                  <Pill className="h-6 w-6 animate-pulse text-primary-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {t("medicine.searching")}
              </div>
            </div>
          </section>
        ) : result !== null && result !== "" ? (
          <section className="surface-soft rounded-3xl border border-border/80 p-4 sm:p-6 ring-soft shadow-card">
            <ChatMessageContent content={result} />
            <div className="mt-4 flex gap-2 rounded-2xl bg-destructive/10 border border-destructive/20 p-3 text-xs sm:text-sm text-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p>Бұл ақпарат тек танысуға арналған. Дәріні қолданбас бұрын маман дәрігермен немесе фармацевтпен кеңесіңіз.</p>
            </div>
          </section>
        ) : (
          <section className="surface-muted rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground ring-soft">
            Дәрі атауын енгізіңіз немесе жоғарыдағы дайын атаулардың бірін таңдаңыз.
          </section>
        )}
      </div>
    </Layout>
  );
};

export default MedicinePage;
