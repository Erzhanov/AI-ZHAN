import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const getAuthenticatedUser = async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("Authorization") || "";

  if (!supabaseUrl || !anonKey || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const { data, error } = await authClient.auth.getUser();

  if (error) return null;
  return data.user;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: jsonHeaders,
        }
      );
    }

    const user = await getAuthenticatedUser(req);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Алдымен аккаунтқа кіріңіз." }),
        {
          status: 401,
          headers: jsonHeaders,
        }
      );
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripePriceId = Deno.env.get("STRIPE_PRICE_ID");
    const appUrl = Deno.env.get("APP_URL");

    if (!stripeSecretKey || !stripePriceId) {
      return new Response(
        JSON.stringify({
          error:
            "Stripe баптауы толық емес. STRIPE_SECRET_KEY және STRIPE_PRICE_ID керек.",
        }),
        {
          status: 500,
          headers: jsonHeaders,
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const origin =
      typeof body.origin === "string" ? body.origin : appUrl;
    const baseUrl = appUrl || origin;

    if (!baseUrl) {
      return new Response(
        JSON.stringify({ error: "APP_URL бапталмаған." }),
        {
          status: 500,
          headers: jsonHeaders,
        }
      );
    }

    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("line_items[0][price]", stripePriceId);
    params.set("line_items[0][quantity]", "1");
    params.set("success_url", `${baseUrl}/pro?payment=success`);
    params.set("cancel_url", `${baseUrl}/pro?payment=cancel`);
    params.set("client_reference_id", user.id);
    params.set("metadata[user_id]", user.id);
    params.set("subscription_data[metadata][user_id]", user.id);
    params.set("customer_email", user.email || "");
    params.set("allow_promotion_codes", "true");

    const stripeResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    );

    const checkoutSession = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Stripe checkout error:", checkoutSession);

      return new Response(
        JSON.stringify({
          error:
            checkoutSession?.error?.message ||
            "Stripe checkout жасау мүмкін болмады.",
        }),
        {
          status: stripeResponse.status,
          headers: jsonHeaders,
        }
      );
    }

    return new Response(
      JSON.stringify({
        url: checkoutSession.url,
      }),
      {
        headers: jsonHeaders,
      }
    );
  } catch (error) {
    console.error("create-pro-checkout error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Белгісіз қате",
      }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    );
  }
});
