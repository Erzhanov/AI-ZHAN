import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ChatMessageContent from "@/components/ChatMessageContent";
import { Bot, Copy, History, MessageSquare, Check } from "lucide-react";

type ChatHistoryItem = {
  id: string;
  mode: string;
  user_message: string;
  ai_response: string | null;
  created_at: string;
};

const modeLabels: Record<string, string> = {
  medical: "Медицина",
  psychology: "Психология",
  motivation: "Мотивация",
  nutrition: "Тамақ",
  fitness: "Фитнес",
};

const HistoryPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, mode, user_message, ai_response, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        toast({ title: "Қате", description: error.message, variant: "destructive" });
      } else {
        setItems(data ?? []);
      }
      setLoading(false);
    };

    loadHistory();
  }, [toast, user]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({ title: "Көшірілді", description: "Толық жауап көшірілді." });
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
    } catch {
      toast({ title: "Қате", description: "Көшіру мүмкін болмады", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="space-y-4 pb-8">
        <section className="surface-soft rounded-3xl border border-border/80 p-5 ring-soft sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-medical shadow-card">
              <History className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Соңғы сұрақтар</h1>
              <p className="text-sm text-muted-foreground">Сұрақ пен толық жауап осы жерде сақталады</p>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="flex items-center justify-center rounded-3xl border border-border/80 bg-white py-16 ring-soft dark:bg-slate-900">
            <div className="spinner-ring h-8 w-8" />
          </section>
        ) : items.length === 0 ? (
          <section className="surface-muted rounded-3xl border border-dashed border-border p-8 text-center ring-soft">
            <MessageSquare className="mx-auto h-10 w-10 text-primary/40" />
            <p className="mt-4 text-sm font-medium text-foreground">Әзірге тарих жоқ</p>
            <p className="mt-2 text-sm text-muted-foreground">Чатта сұрақ қойылғаннан кейін толық жауап осы бетте көрінеді.</p>
          </section>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="surface-soft rounded-3xl border border-border/80 p-5 ring-soft sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                      {modeLabels[item.mode] ?? item.mode}
                    </div>
                    <h2 className="mt-3 text-sm font-semibold text-foreground sm:text-base">{item.user_message}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString("kk-KZ", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {item.ai_response && (
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.ai_response || "")}
                      className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-white px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground dark:bg-slate-900"
                    >
                      {copiedId === item.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedId === item.id ? "Көшірілді" : "Жауапты көшіру"}
                    </button>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-medical shadow-card">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 rounded-2xl border border-border/80 bg-white px-4 py-3 text-sm leading-6 text-foreground shadow-card dark:bg-slate-900">
                    {item.ai_response ? <ChatMessageContent content={item.ai_response} /> : <p className="text-muted-foreground">Жауап сақталмаған.</p>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;
