import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, MessageCircle, Sparkles } from "lucide-react";

interface Review {
  id: string;
  user_id: string;
  content: string;
  rating: number | null;
  created_at: string;
}

const ReviewsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchReviews = async () => {
    setFetching(true);
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });

    if (data) {
      setReviews(data);
      const userIds = [...new Set(data.map((r) => r.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        if (profiles) {
          const map: Record<string, string> = {};
          profiles.forEach((p) => {
            map[p.user_id] = p.full_name || "Белгісіз";
          });
          setUserNames(map);
        }
      }
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    if (rating === 0) {
      toast({ title: "Қате", description: "Жұлдыз арқылы баға беріңіз", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      content: content.trim(),
      rating,
    });

    if (error) {
      toast({ title: "Қате", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Рақмет", description: "Пікіріңіз сәтті жіберілді" });
      setContent("");
      setRating(0);
      fetchReviews();
    }
    setLoading(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("kk-KZ", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Layout>
      <div className="space-y-5 px-4 pb-6 pt-2 sm:px-6 lg:px-8 lg:space-y-6 lg:pb-8">
        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="glass-panel reveal-up rounded-[32px] border border-white/70 p-6 shadow-card dark:border-border/80 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-sm shadow-card dark:bg-slate-900/80">
              <Sparkles className="h-4 w-4 text-primary" />
              Қауымдастық пікірі
            </div>
            <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Пайдаланушы пікірлеріне арналған жаңа бет</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Бұл бөлімде пікір қалдыру формасы мен қолданушылардың бағалары енді құрылымды, кеңірек және телефонға бейім форматта көрінеді.
            </p>
          </div>

          <div className="rounded-[32px] bg-slate-950 p-6 text-white shadow-elevated reveal-up delay-1 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <MessageCircle className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="font-semibold">Кері байланыс</p>
                <p className="text-sm text-white/65">Өнімді жақсартуға көмектеседі</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/72">
              Пікірлер командаға интерфейсті, жауап сапасын және қолданушы тәжірибесін жақсартуға бағыт береді.
            </p>
          </div>
        </section>

        <section className="reveal-up delay-2 rounded-[32px] border border-border/70 bg-white/90 p-5 shadow-card dark:bg-slate-900/90 sm:p-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Пікір қалдыру</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">Қысқаша ойыңызды жазып, сервисті 1-ден 5-ке дейін бағалаңыз.</p>

          <div className="mt-5 flex items-center gap-1">
            <span className="mr-2 text-sm text-muted-foreground">Баға:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star className={`h-7 w-7 ${(s <= (hoverRating || rating)) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
              </button>
            ))}
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Сайт туралы ойыңызды жазыңыз..."
            className="mt-5 min-h-[120px] resize-none rounded-2xl"
            maxLength={1000}
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">{content.length}/1000</span>
            <Button onClick={handleSubmit} disabled={loading || !content.trim() || rating === 0} className="rounded-2xl gradient-medical text-primary-foreground">
              {loading ? <div className="spinner-ring h-4 w-4" /> : <><Send className="mr-2 h-4 w-4" /> Жіберу</>}
            </Button>
          </div>
        </section>

        <section className="space-y-4 reveal-up delay-3">
          {fetching ? (
            <div className="flex items-center justify-center rounded-[32px] border border-border/70 bg-white/90 py-16 shadow-card dark:bg-slate-900/90">
              <div className="spinner-ring h-8 w-8" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-border bg-white/75 px-6 py-14 text-center shadow-card dark:bg-slate-900/75">
              <MessageCircle className="mx-auto h-14 w-14 text-primary/35" />
              <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">Әзірге пікір жоқ</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">Бірінші болып өз пікіріңізді қалдырыңыз.</p>
            </div>
          ) : (
            reviews.map((r, index) => {
              const name = userNames[r.user_id] || "Белгісіз";
              return (
                <article key={r.id} className={`rounded-[28px] border border-border/70 bg-white/90 p-5 shadow-card dark:bg-slate-900/90 reveal-up delay-${(index % 3) + 1}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary font-semibold text-foreground">
                        {name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                      </div>
                    </div>
                    {r.rating && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-4 w-4 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-foreground/85">{r.content}</p>
                </article>
              );
            })
          )}
        </section>
      </div>
    </Layout>
  );
};

export default ReviewsPage;

