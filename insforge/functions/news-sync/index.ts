/**
 * news-sync edge function
 * 1. Fetches US political news from NewsData.io
 * 2. Scrapes + bias-analyzes each article (Haiku)
 * 3. Saves articles to `news` table
 * 4. AI-clusters the saved articles (Haiku) and caches in `news_clusters`
 *
 * Triggered by a scheduled cron job every 12 hours.
 */

const BASE_URL = (Deno.env.get("INSFORGE_BASE_URL") || Deno.env.get("INSFORGE_INTERNAL_URL") || "").replace(/\/$/, "");
const API_KEY = Deno.env.get("API_KEY")!;
const NEWSDATA_API_KEY = Deno.env.get("NEWSDATA_API_KEY")!;
const MODEL = "anthropic/claude-sonnet-4.6";

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function scrapeText(url: string): Promise<string> {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) return "";
    const html = await resp.text();
    return stripHtml(html).slice(500, 2500);
  } catch {
    return "";
  }
}

async function analyzeBias(text: string): Promise<{ left: number; center: number; right: number }> {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an expert political media analyst. Analyze the provided text, which is a US political news article. " +
          "Evaluate the text for: 1. Loaded language or emotional adjectives. 2. Selective omission of opposing viewpoints. " +
          "3. Policy framing (e.g., social safety nets vs. fiscal responsibility). " +
          'Return ONLY a JSON object: {"left": int, "center": int, "right": int}. Values MUST sum to 100.',
      },
      { role: "user", content: `Analyze: ${text}` },
    ],
    stream: false,
  };

  const resp = await fetch(`${BASE_URL}/api/ai/chat/completion`, {
    method: "POST",
    headers: DB_HEADERS,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60_000),
  });
  if (!resp.ok) throw new Error(`AI bias error ${resp.status}`);
  const data = await resp.json();
  const content: string = data.text || data.message || "";
  return JSON.parse(content.replace(/```json/g, "").replace(/```/g, "").trim());
}

async function clusterWithAI(articles: unknown[]): Promise<unknown[]> {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a political media analyst. Return ONLY JSON.\n" +
          "Group these articles into clusters where each cluster = ONE real-world event.\n" +
          "Each article_id must appear in exactly one cluster.\n" +
          'Schema: {"clusters":[{"id":"string","title":"string","timestamp":"string","article_ids":["string"],' +
          '"perspectives":{"left":"string","center":"string","right":"string"}}]}\n' +
          "No markdown, no explanation, valid JSON only.",
      },
      { role: "user", content: JSON.stringify({ articles }) },
    ],
    stream: false,
  };

  const resp = await fetch(`${BASE_URL}/api/ai/chat/completion`, {
    method: "POST",
    headers: DB_HEADERS,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120_000),
  });
  if (!resp.ok) throw new Error(`AI cluster error ${resp.status}`);
  const data = await resp.json();
  const content: string = data.text || data.message || "";
  const parsed = JSON.parse(content.replace(/```json/g, "").replace(/```/g, "").trim());
  return parsed.clusters || [];
}

async function clearNews(): Promise<void> {
  const resp = await fetch(
    `${BASE_URL}/api/database/records/news?article_id=not.is.null`,
    { method: "DELETE", headers: DB_HEADERS }
  );
  if (resp.status !== 200 && resp.status !== 204) {
    console.warn(`Clear news returned ${resp.status}`);
  }
}

async function upsertRecords(records: unknown[]): Promise<void> {
  const resp = await fetch(`${BASE_URL}/api/database/records/news`, {
    method: "POST",
    headers: {
      ...DB_HEADERS,
      Prefer: "return=representation,resolution=merge-duplicates",
      on_conflict: "article_id",
    },
    body: JSON.stringify(records),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Upsert failed ${resp.status}: ${body}`);
  }
}

async function saveClusters(clusters: unknown[]): Promise<void> {
  // Clear old clusters then insert fresh
  await fetch(`${BASE_URL}/api/database/records/news_clusters?id=gt.0`, {
    method: "DELETE",
    headers: DB_HEADERS,
  });
  const resp = await fetch(`${BASE_URL}/api/database/records/news_clusters`, {
    method: "POST",
    headers: DB_HEADERS,
    body: JSON.stringify({ clusters }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Save clusters failed ${resp.status}: ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!NEWSDATA_API_KEY) {
    return new Response(
      JSON.stringify({ error: "NEWSDATA_API_KEY not configured" }),
      { status: 500, headers: corsHeaders }
    );
  }

  console.log("Starting news sync...");

  // 1. Fetch from NewsData.io
  const params = new URLSearchParams({
    apikey: NEWSDATA_API_KEY,
    language: "en",
    category: "politics",
    country: "us",
  });
  const newsResp = await fetch(`https://newsdata.io/api/1/latest?${params}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!newsResp.ok) {
    return new Response(
      JSON.stringify({ error: `NewsData fetch failed: ${newsResp.status}` }),
      { status: 502, headers: corsHeaders }
    );
  }
  const newsJson = await newsResp.json();
  const rawArticles: Record<string, unknown>[] = (newsJson.results || []).slice(0, 20);

  const skipKeywords = [
    "listings", "rating", "ratings", "stocks", "stock", "forecast", "horoscope",
    "trading", "price", "nasdaq", "nyse", "dividend",
    "crypto", "bitcoin", "ethereum", "market", "shares", "earnings",
    "otcmkts", "nyse:", "inc.", "ltd.", "equities", "reiterated",
  ];

  // 2. Scrape + bias analysis
  const dbEntries: Record<string, unknown>[] = [];
  for (const article of rawArticles) {
    const title = String(article.title || "").toLowerCase();
    if (skipKeywords.some((kw) => title.includes(kw))) {
      console.log(`Skipping: ${title.slice(0, 40)}`);
      continue;
    }

    const url = String(article.link || "");
    const articleTitle = String(article.title || "Untitled");

    let text = url ? await scrapeText(url) : "";
    if (text.length < 100) text = String(article.description || "").slice(0, 2000);
    else text = text.slice(0, 2000);
    // Last resort: use the title so bias analysis always has something to work with
    if (text.trim().length < 20) text = articleTitle;

    let bias = { left: 0, center: 100, right: 0 };
    if (text.trim().length > 20) {
      try {
        bias = await analyzeBias(text);
        console.log(`Bias OK: ${articleTitle.slice(0, 40)}`);
      } catch (e) {
        console.error(`Bias error for "${articleTitle.slice(0, 40)}": ${e}`);
      }
    }

    dbEntries.push({
      article_id: String(article.article_id || article.link || articleTitle),
      title: articleTitle,
      link: url,
      image: article.image_url || null,
      source: article.source_name || null,
      date: article.pubDate || null,
      bias_left: bias.left,
      bias_center: bias.center,
      bias_right: bias.right,
    });
  }

  // 3. Persist articles
  try {
    await clearNews();
    if (dbEntries.length > 0) await upsertRecords(dbEntries);
    console.log(`Saved ${dbEntries.length} articles.`);
  } catch (e) {
    console.error(`DB error: ${e}`);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }

  // 4. AI cluster and cache (so news-api is instant)
  try {
    const contexts = dbEntries.map((r) => ({
      article_id: r.article_id,
      title: r.title,
      source: r.source,
      date: r.date,
      bias_left: r.bias_left,
      bias_center: r.bias_center,
      bias_right: r.bias_right,
    }));
    const clusters = await clusterWithAI(contexts);
    await saveClusters(clusters);
    console.log(`Cached ${clusters.length} clusters.`);
  } catch (e) {
    console.warn(`Clustering failed (non-fatal): ${e}`);
  }

  return new Response(
    JSON.stringify({ status: "ok", saved: dbEntries.length }),
    { headers: corsHeaders }
  );
}
