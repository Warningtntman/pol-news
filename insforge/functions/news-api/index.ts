/**
 * news-api edge function
 * Reads articles and pre-computed clusters from the DB.
 * No AI calls — clustering is done by news-sync at ingest time.
 */

const BASE_URL = (Deno.env.get("INSFORGE_BASE_URL") || Deno.env.get("INSFORGE_INTERNAL_URL") || "").replace(/\/$/, "");
const API_KEY = Deno.env.get("API_KEY")!;

const DB_HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Fetch articles and cached clusters in parallel
  const [articlesResp, clustersResp] = await Promise.all([
    fetch(`${BASE_URL}/api/database/records/news?order=id.desc`, { headers: DB_HEADERS }),
    fetch(`${BASE_URL}/api/database/records/news_clusters?order=id.desc&limit=1`, { headers: DB_HEADERS }),
  ]);

  if (!articlesResp.ok) {
    return new Response(
      JSON.stringify({ error: `DB fetch failed: ${articlesResp.status}` }),
      { status: 502, headers: corsHeaders }
    );
  }

  const articles = await articlesResp.json();
  let clusters: unknown[] = [];

  if (clustersResp.ok) {
    const rows = await clustersResp.json();
    if (Array.isArray(rows) && rows.length > 0) {
      clusters = rows[0].clusters || [];
    }
  }

  return new Response(
    JSON.stringify({ status: "success", articles, clusters }),
    { headers: corsHeaders }
  );
}
