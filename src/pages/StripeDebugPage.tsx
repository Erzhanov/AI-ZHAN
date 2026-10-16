import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RefreshCw, Crown, AlertCircle, CheckCircle2 } from "lucide-react";

interface WebhookEvent {
  id: string;
  stripe_event_id: string | null;
  event_type: string;
  user_id: string | null;
  subscription_id: string | null;
  status: string;
  error_message: string | null;
  payload: unknown;
  created_at: string;
}

interface ProProfile {
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  subscription_plan: string;
  pro_expires_at: string | null;
  pro_payment_provider: string | null;
  pro_payment_reference: string | null;
  updated_at: string;
}

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("kk-KZ", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
};

const statusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "error") return "destructive";
  if (status.startsWith("pro_")) return "default";
  if (status.startsWith("skipped") || status === "ignored") return "outline";
  return "secondary";
};

const StripeDebugPage = () => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [proProfiles, setProProfiles] = useState<ProProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [eventsRes, proRes] = await Promise.all([
      supabase
        .from("stripe_webhook_events" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("profiles")
        .select("user_id, display_name, full_name, subscription_plan, pro_expires_at, pro_payment_provider, pro_payment_reference, updated_at")
        .eq("subscription_plan", "pro")
        .order("updated_at", { ascending: false })
        .limit(50),
    ]);

    if (eventsRes.data) setEvents(eventsRes.data as unknown as WebhookEvent[]);
    if (proRes.data) setProProfiles(proRes.data as unknown as ProProfile[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("stripe-debug")
      .on("postgres_changes", { event: "*", schema: "public", table: "stripe_webhook_events" }, load)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Stripe Debug</h1>
            <p className="text-sm text-muted-foreground">Соңғы webhook оқиғалары мен Pro профильдер</p>
          </div>
          <Button onClick={load} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Жаңарту
          </Button>
        </div>

        <Card className="p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            Pro профильдер ({proProfiles.length})
          </h2>
          {proProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Әзірге Pro профиль жоқ.</p>
          ) : (
            <div className="space-y-2">
              {proProfiles.map((p) => (
                <div key={p.user_id} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/40 rounded-md text-sm">
                  <div className="space-y-0.5">
                    <div className="font-medium">{p.full_name || p.display_name || p.user_id}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.user_id}</div>
                    {p.pro_payment_reference && (
                      <div className="text-xs text-muted-foreground font-mono">sub: {p.pro_payment_reference}</div>
                    )}
                  </div>
                  <div className="text-right text-xs space-y-0.5">
                    <div>Аяқталу: <span className="font-medium">{formatDate(p.pro_expires_at)}</span></div>
                    <div className="text-muted-foreground">Жаңартылған: {formatDate(p.updated_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-3">Webhook оқиғалары ({events.length})</h2>
          {events.length === 0 ? (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Әзірге оқиғалар жоқ. Stripe Dashboard → Developers → Webhooks-та endpoint қосылғанын тексеріңіз:</p>
              <code className="block p-2 bg-muted rounded text-xs break-all">
                https://yxwhkwxgdtbxdbmgrvpx.supabase.co/functions/v1/stripe-webhook
              </code>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((e) => {
                const isOpen = expanded === e.id;
                const isError = e.status === "error";
                const isSuccess = e.status.startsWith("pro_");
                return (
                  <div key={e.id} className="border border-border rounded-md text-sm">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : e.id)}
                      className="w-full p-3 flex items-start justify-between gap-2 text-left hover:bg-muted/40 transition"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        {isError ? (
                          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        ) : isSuccess ? (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-4 h-4 shrink-0" />
                        )}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs">{e.event_type}</span>
                            <Badge variant={statusVariant(e.status)} className="text-xs">{e.status}</Badge>
                          </div>
                          {e.user_id && <div className="text-xs text-muted-foreground font-mono truncate">user: {e.user_id}</div>}
                          {e.subscription_id && <div className="text-xs text-muted-foreground font-mono truncate">sub: {e.subscription_id}</div>}
                          {e.error_message && <div className="text-xs text-destructive">{e.error_message}</div>}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">{formatDate(e.created_at)}</div>
                    </button>
                    {isOpen && (
                      <pre className="p-3 bg-muted/40 text-xs overflow-x-auto border-t border-border max-h-96">
                        {JSON.stringify(e.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default StripeDebugPage;
