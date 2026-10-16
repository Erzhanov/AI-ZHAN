import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { safeUUID } from "@/lib/safe-uuid";

let proStatusChannelCounter = 0;

interface ProStatus {
  isPro: boolean;
  proExpiresAt: string | null;
  loading: boolean;
}

export const useProStatus = (): ProStatus => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_plan, pro_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!isMounted) return;

      const expiresAt = data?.pro_expires_at ? new Date(data.pro_expires_at).getTime() : null;
      const active = data?.subscription_plan?.toLowerCase() === "pro" && (!expiresAt || expiresAt > Date.now());
      setIsPro(active);
      setProExpiresAt(data?.pro_expires_at ?? null);
      setLoading(false);
    };

    void load();

    // Supabase reuses channels with the same topic; make the topic collision-proof.
    const channelName = `pro-status-${user.id}-${safeUUID()}-${proStatusChannelCounter++}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { subscription_plan?: string; pro_expires_at?: string };
          const expiresAt = row.pro_expires_at ? new Date(row.pro_expires_at).getTime() : null;
          const active = row.subscription_plan?.toLowerCase() === "pro" && (!expiresAt || expiresAt > Date.now());
          setIsPro(active);
          setProExpiresAt(row.pro_expires_at ?? null);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { isPro, proExpiresAt, loading };
};
