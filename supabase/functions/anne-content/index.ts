import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json;charset=utf-8",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: corsHeaders });
}

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Server configuration unavailable" }, 500);
  }
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  });
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const action = String(body.action || "catalog").toLowerCase();
  const action = String(body.action || "catalog").toLowerCase();

  if (action === "catalog") {
    const { data, error } = await admin
      .from("anne_content_sources")
      .select("source_id,title,source_type,source_url,license_label,sample_limit,enabled,display_order")
      .eq("enabled", true)
      .order("display_order", { ascending: true })
      .order("title", { ascending: true });

    if (error) return json({ error: error.message }, 500);
    return json({ sources: data || [] });
  }

  if (action === "sentences" || action === "sentence") {
    const sourceId = String(body.source_id || "").trim();
    if (!sourceId) return json({ error: "source_id is required" }, 400);

    const { data: source, error: sourceError } = await admin
      .from("anne_content_sources")
      .select("source_id,title,sample_limit,enabled")
      .eq("source_id", sourceId)
      .maybeSingle();
    if (sourceError) return json({ error: sourceError.message }, 500);
    if (!source || !source.enabled) return json({ error: "Source not available" }, 404);
    if (!source || !source.enabled) return json({ error: "Source not available" }, 404);

    const limit = clampInt(body.limit, source.sample_limit || 20, 1, 100);
    const offset = clampInt(body.offset, 0, 0, 100000);
    const requestedRow = clampInt(body.source_row, 0, 1, 100000);

    let query = admin
      .from("anne_source_sentences")
      .select(
        "sentence_id,source_id,source_index,source_row,source_date,source_text,enabled,anne_sentence_learning(*),anne_sentence_chunks(*),anne_sentence_reviews(*)",
      )
      .eq("source_id", sourceId)
      .eq("enabled", true);

    if (action === "sentence") {
      if (!requestedRow) return json({ error: "source_row is required" }, 400);
      query = query.eq("source_row", requestedRow).limit(1);
    } else {
      query = query.order("source_index", { ascending: true }).range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) return json({ error: error.message }, 500);

    return json({
      access: "public",
      source,
      data: data || [],
    });
  }

  return json({ error: "Unknown action" }, 400);
});
