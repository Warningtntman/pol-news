/**
 * news-search edge function
 * Live search: fetches US political news from NewsData.io filtered by query,
 * runs AI bias analysis via InsForge, and returns results.
 * Called by the frontend at /api/search?q=<query>
 */

const BASE_URL = (Deno.env.get("INSFORGE_BASE_URL") || Deno.env.get("INSFORGE_INTERNAL_URL") || "").replace(/\/$/, "");
const API_KEY = Deno.env.get("API_KEY")!;
const NEWSDATA_API_KEY = Deno.env.get("NEWSDATA_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

const SKIP_KEYWORDS = [
  "listings","ratings","stocks","forecast","horoscope","trading","price",
  "nasdaq","nyse","dividend","staked","crypto","bitcoin","ethereum","network",
  "yield","investing","market","inc.","ltd.","shares","equities","earnings",
];

async function analyzeBias(text: string): Promise<{ left: number; center: number; right: number }> {
  const payload = {
    model: "x-ai/grok-4.1-fast",
    messages: [
      {
        role: "system",
        content:
          "You are an expert political media analyst. Analyze the provided text, which is a US political news article. " +
          "Evaluate the text for: 1. Loaded language or emotional adjectives. 2. Selective omission of opposing viewpoints. " +
          "3. Policy framing (e.g., social safety nets vs. fiscal responsibility). " +
          "Return ONLY a JSON object with integer percentages representing the bias: " +
          '{"left": int, "center": int, "right": int}. The values MUST sum to exactly 100.',
      },
      {
        role: "user",
        content: `Analyze the following political text: ${text}`,
      },
    ],
    stream: false,
  };

  const resp = await fetch(`${BASE_URL}/api/ai/chat/completion`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) throw new Error(`AI error ${resp.status}`);
  const data = await resp.json();
  const content: string = data.text || data.message || "";
  const clean = content.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(clean);
  if (typeof parsed === "object" && "left" in parsed) return parsed;
  throw new Error("Invalid bias response");
}

export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  if (!q) {
    return new Response(
      JSON.stringify({ status: "error", message: "Missing query parameter: q", articles: [] }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Fetch from NewsData.io
  const params = new URLSearchParams({
    apikey: NEWSDATA_API_KEY,
    language: "en",
    category: "politics",
    country: "us",
    qInTitle: q,
  });

  const ndResp = await fetch(`https://newsdata.io/api/1/latest?${params}`, {
    signal: AbortSignal.timeout(10_000),
  });
  const ndData = await ndResp.json();

  if (ndData.status === "error") {
    return new Response(
      JSON.stringify({ status: "error", message: "NewsData API Error", articles: [] }),
      { headers: corsHeaders }
    );
  }

  const rawArticles: any[] = (ndData.results || []).slice(0, 6);

  // Process articles concurrently with a concurrency limit of 4
  const sem = { count: 0, max: 4, queue: [] as (() => void)[] };
  function acquire(): Promise<void> {
    if (sem.count < sem.max) { sem.count++; return Promise.resolve(); }
    return new Promise((res) => sem.queue.push(res));
  }
  function release() {
    const next = sem.queue.shift();
    if (next) { next(); } else { sem.count--; }
  }

  async function processArticle(article: any) {
    await acquire();
    try {
      const rawTitle = String(article.title || "Untitled");
      const titleLower = rawTitle.toLowerCase();
      if (SKIP_KEYWORDS.some((kw) => titleLower.includes(kw))) return null;

      const description = String(article.description || rawTitle);
      const text = description.slice(0, 2000);

      let bias = { left: 0, center: 100, right: 0 };
      if (text.trim().length > 15) {
        try {
          const result = await analyzeBias(text);
          bias = result;
        } catch {
          // keep defaults
        }
      }

      return {
        article_id: String(article.article_id || article.link || rawTitle),
        title: rawTitle,
        link: String(article.link || ""),
        image: article.image_url || null,
        source: article.source_name || null,
        date: article.pubDate || null,
        bias_left: bias.left,
        bias_center: bias.center,
        bias_right: bias.right,
      };
    } finally {
      release();
    }
  }

  const results = await Promise.all(rawArticles.map(processArticle));
  const articles = results.filter(Boolean);

  return new Response(
    JSON.stringify({ status: "success", articles }),
    { headers: corsHeaders }
  );
}
