import httpx
import os
import json
import asyncio
import re
import trafilatura
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

load_dotenv()

# --- CONFIGURATION ---
INSFORGE_BASE_URL = os.getenv("INSFORGE_BASE_URL", "").rstrip('/')
# Use your ik_ Integration Key for full database permissions
INSFORGE_KEY = os.getenv("INSFORGE_API_KEY") 
NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")

HAS_INFORGE = bool(INSFORGE_BASE_URL and INSFORGE_KEY)
HAS_NEWSDATA = bool(NEWSDATA_API_KEY)

class InsForgeClient:
    def __init__(self) -> None:
        self.base_url = INSFORGE_BASE_URL
        self._key = INSFORGE_KEY

    @property
    def _headers(self) -> dict:
        return {
            'Authorization': f'Bearer {self._key}',
            'Content-Type': 'application/json',
        }

    async def analyze_bias(self, text: str):
        """Calls Grok 4.1 via InsForge Gateway"""
        payload = {
            'model': 'x-ai/grok-4.1-fast',
            'messages': [
                {
                    "role": "system", 
                    "content": (
                        "You are an expert political media analyst. Analyze the provided text, which is a US political news article. "
                        "Evaluate the text for: 1. Loaded language or emotional adjectives. 2. Selective omission of opposing viewpoints. "
                        "3. Policy framing (e.g., social safety nets vs. fiscal responsibility). "
                        "Return ONLY a JSON object with integer percentages representing the bias: "
                        "{'left': int, 'center': int, 'right': int}. The values MUST sum to exactly 100."
                    )
                },
                {"role": "user", "content": f"Analyze the following political text: {text}"}
            ],
            'stream': False
        }
        async with httpx.AsyncClient(timeout=60) as http:
            resp = await http.post(f'{self.base_url}/api/ai/chat/completion', headers=self._headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data.get('text') or data.get('message') or ""
            clean_json = content.replace('```json', '').replace('```', '').strip()
            return json.loads(clean_json)

    async def cluster_topics_with_summaries(self, article_contexts: list):
        """Calls Claude to group articles and generate perspective summaries."""
        payload = {
            'model': 'anthropic/claude-3.5-sonnet',
            'messages': [
                {
                    "role": "system",
                    "content": (
                        "You are a political media analyst. Return ONLY JSON.\n"
                        "TASK — Event rows for a news app:\n"
                        "- Each cluster = ONE real-world news EVENT (same story), e.g. same plane crash, same vote, same court ruling.\n"
                        "- Put EVERY outlet covering that SAME event in the SAME cluster's article_ids "
                        "(that row will be shown as one horizontal carousel of sources).\n"
                        "- Different events MUST be in DIFFERENT clusters (stacked vertically in the UI).\n"
                        "- If two articles do not describe the SAME concrete event (same incident, vote, ruling, speech, crash, etc.), "
                        "they MUST NOT share a cluster — even if both mention the same politician or 'Washington'.\n"
                        "- Aim for as many clusters as distinct events (often 3–8). Do NOT dump unrelated stories into one cluster.\n"
                        "- Each article_id in the input must appear in EXACTLY ONE cluster. Copy article_id strings EXACTLY from the input.\n"
                        "For EACH cluster: short event title + timestamp (use newest date among its articles) + "
                        "left/center/right perspective summaries.\n"
                        "Critical: each perspective summary must include at least one direct short quote verbatim from "
                        "the provided scraped excerpts, wrapped in double quotes.\n"
                        "Schema:\n"
                        "{\n"
                        "  \"clusters\": [{\n"
                        "    \"id\": \"string\",\n"
                        "    \"title\": \"string\",\n"
                        "    \"timestamp\": \"string\",\n"
                        "    \"article_ids\": [\"string\"],\n"
                        "    \"perspectives\": {\n"
                        "      \"left\": \"string with at least one quoted phrase\",\n"
                        "      \"center\": \"string with at least one quoted phrase\",\n"
                        "      \"right\": \"string with at least one quoted phrase\"\n"
                        "    }\n"
                        "  }]\n"
                        "}\n"
                        "Constraints: no markdown, no explanation, valid JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps({"articles": article_contexts}, ensure_ascii=True),
                },
            ],
            'stream': False
        }
        async with httpx.AsyncClient(timeout=120) as http:
            resp = await http.post(f'{self.base_url}/api/ai/chat/completion', headers=self._headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data.get('text') or data.get('message') or ""
            clean_json = content.replace('```json', '').replace('```', '').strip()
            return json.loads(clean_json)

    async def clear_news(self):
        """Force wipes the table using a non-null filter"""
        async with httpx.AsyncClient(timeout=30) as http:
            # Using 'not.is.null' is more reliable than 'gt.0' for all ID types
            resp = await http.delete(
                f'{self.base_url}/api/database/records/news?article_id=not.is.null', 
                headers=self._headers
            )
            if resp.status_code in [200, 204]:
                print("Database successfully wiped.")
            else:
                print(f"Clear skipped or failed (Status {resp.status_code})")

    async def save_records(self, records: list):
        """Saves news using Upsert to handle potential duplicates gracefully"""
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(
                f'{self.base_url}/api/database/records/news',
                headers={
                    **self._headers, 
                    'Prefer': 'return=representation,resolution=merge-duplicates',
                    'on_conflict': 'article_id'
                },
                json=records
            )
            resp.raise_for_status()
            return resp.json()

    async def get_records(self):
        """Fetches stored news for the API endpoint"""
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.get(f'{self.base_url}/api/database/records/news?order=id.desc', headers=self._headers)
            resp.raise_for_status()
            return resp.json()

insforge = InsForgeClient()


def extract_quote_candidates(text: str):
    if not text:
        return []

    # Prefer quoted snippets if present.
    quoted = re.findall(r'["“](.{20,180}?)["”]', text)
    if quoted:
        return [q.strip() for q in quoted[:8] if q.strip()]

    # Fallback: short sentence-like fragments.
    fragments = re.split(r'(?<=[.!?])\s+', text)
    clean = [f.strip() for f in fragments if 30 <= len(f.strip()) <= 180]
    return clean[:8]


_STOPWORDS = frozenset({
    "that", "this", "with", "from", "have", "been", "were", "will", "would", "could",
    "should", "about", "after", "before", "into", "over", "under", "than", "then",
    "them", "their", "there", "these", "those", "what", "when", "where", "which",
    "while", "whose", "your", "some", "such", "other", "only", "just", "also",
    "more", "most", "many", "much", "very", "even", "like", "said", "says", "news",
    "breaking", "latest", "update", "report", "reports", "according", "president",
    "house", "senate", "state", "states", "city", "year", "years", "day", "days",
    # Political / news boilerplate — shared by unrelated stories, must not drive clustering
    "trump", "biden", "harris", "obama", "desantis", "congress", "republican", "republicans",
    "democrat", "democrats", "democratic", "gop", "white", "washington", "federal",
    "government", "official", "officials", "court", "supreme", "judge", "ruling", "case",
    "bill", "law", "vote", "voting", "election", "campaign", "political", "politics",
    "country", "national", "security", "border", "immigration", "tax", "budget", "plan",
    "plans", "calls", "amid", "during", "against", "make", "made", "take", "taken",
    "new", "old", "high", "big", "top", "back", "out", "off", "way", "now", "how", "why",
    "her", "his", "him", "she", "they", "our", "its", "who", "but", "not", "all", "any",
    "get", "got", "one", "two", "may", "can", "set", "use", "used", "man", "men", "war",
})


def _normalize_headline(s: str) -> str:
    if not s:
        return ""
    t = s.lower()
    t = re.sub(r"f[\s-]*35", "f35", t, flags=re.I)
    t = re.sub(r"f[\s-]*16", "f16", t, flags=re.I)
    t = re.sub(r"\b(u\.?s\.?a?|united states|american)\b", "us", t)
    return t


def _title_tokens(title: str) -> frozenset:
    t = _normalize_headline(title)
    words = re.findall(r"[a-z0-9]+", t)
    out = set()
    for w in words:
        if w in _STOPWORDS:
            continue
        # Drop short glue unless it's a compact tag like f35, mh370, 737
        if len(w) < 4 and not re.search(r"\d", w):
            continue
        out.add(w)
    return frozenset(out)


def _token_document_frequency(items: list) -> dict[str, int]:
    """How many headlines contain each token (for rarity gating)."""
    df: dict[str, int] = {}
    for it in items:
        for t in set(it["tokens"]):
            df[t] = df.get(t, 0) + 1
    return df


def _pair_same_story(tokens_i: frozenset, tokens_j: frozenset, df: dict[str, int]) -> bool:
    """
    Conservative merge: unrelated political stories often share 'trump', 'white house', etc.
    Require strong overlap OR rare shared tokens that appear in at most 2 headlines.
    """
    if not tokens_i or not tokens_j:
        return False
    shared = tokens_i & tokens_j
    if not shared:
        return False
    union = tokens_i | tokens_j
    jac = len(shared) / len(union)
    rare_in_shared = [t for t in shared if df.get(t, 0) <= 2]
    long_shared = [t for t in shared if len(t) >= 6]

    # Strong same-headline signal: multiple rare-ish overlaps
    if len(rare_in_shared) >= 2 and jac >= 0.2:
        return True
    # One very distinctive token (long + rare) plus decent overlap
    if long_shared and len(rare_in_shared) >= 1 and jac >= 0.22:
        return True
    # Nearly same wording (different outlet, same event)
    if jac >= 0.42 and len(shared) >= 3:
        return True
    if jac >= 0.55 and len(shared) >= 2:
        return True
    return False


class _UnionFind:
    def __init__(self, n: int) -> None:
        self._p = list(range(n))

    def find(self, x: int) -> int:
        while self._p[x] != x:
            self._p[x] = self._p[self._p[x]]
            x = self._p[x]
        return x

    def union(self, a: int, b: int) -> None:
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self._p[rb] = ra


def _heuristic_event_clusters(records: list) -> list:
    """
    Group articles whose headlines share vocabulary (same event, different sources).
    Uses conservative pairwise rules so unrelated stories rarely land in one row.
    """
    items = []
    for r in records[:25]:
        aid = str(r.get("article_id") or r.get("id") or "")
        if not aid:
            continue
        title = (r.get("title") or "") or ""
        items.append({"article_id": aid, "title": title, "tokens": _title_tokens(title)})

    if not items:
        return []

    n = len(items)
    df = _token_document_frequency(items)
    uf = _UnionFind(n)
    for i in range(n):
        for j in range(i + 1, n):
            if _pair_same_story(items[i]["tokens"], items[j]["tokens"], df):
                uf.union(i, j)

    groups: dict[int, list[int]] = {}
    for i in range(n):
        root = uf.find(i)
        groups.setdefault(root, []).append(i)

    generic_perspectives = {
        "left": "Coverage emphasizes accountability, civil impacts, and institutional response.",
        "center": "Coverage emphasizes confirmed facts, procedures, and official statements.",
        "right": "Coverage emphasizes security, trade-offs, and critiques of policy or narrative.",
    }

    clusters = []
    for gi, idxs in enumerate(sorted(groups.values(), key=lambda ix: (-len(ix), ix[0]))):
        ids = [items[i]["article_id"] for i in idxs]
        titles = [items[i]["title"] for i in idxs if items[i]["title"]]
        headline = min(titles, key=len) if titles else f"Story {gi + 1}"
        if len(headline) > 120:
            headline = headline[:117] + "..."
        clusters.append({
            "id": f"event-{gi + 1}",
            "title": headline,
            "timestamp": "",
            "article_ids": ids,
            "perspectives": dict(generic_perspectives),
        })
    return clusters


def _sanitize_and_complete_clusters(
    raw_clusters: list,
    ordered_article_ids: list,
    id_to_record: dict,
) -> list:
    """Keep only valid IDs, first-assignment wins; add one-cluster-per orphan."""
    valid = set(ordered_article_ids)
    assigned: set[str] = set()
    out = []

    for i, c in enumerate(raw_clusters or []):
        if not isinstance(c, dict):
            continue
        ids = []
        for aid in c.get("article_ids") or []:
            s = str(aid).strip()
            if s in valid and s not in assigned:
                ids.append(s)
                assigned.add(s)
        if not ids:
            continue
        pers = c.get("perspectives") or {}
        out.append({
            "id": str(c.get("id") or f"cluster-{i + 1}"),
            "title": str(c.get("title") or "Story"),
            "timestamp": str(c.get("timestamp") or ""),
            "article_ids": ids,
            "perspectives": {
                "left": str(pers.get("left") or ""),
                "center": str(pers.get("center") or ""),
                "right": str(pers.get("right") or ""),
            },
        })

    generic = {
        "left": "Coverage emphasizes accountability and civil impacts.",
        "center": "Coverage emphasizes verifiable facts and official updates.",
        "right": "Coverage emphasizes governance trade-offs and competing narratives.",
    }
    for oid in ordered_article_ids:
        if oid in valid and oid not in assigned:
            rec = id_to_record.get(oid) or {}
            title = (rec.get("title") or "Story")[:120]
            out.append({
                "id": f"single-{oid[:16]}",
                "title": title,
                "timestamp": str(rec.get("date") or ""),
                "article_ids": [oid],
                "perspectives": dict(generic),
            })
            assigned.add(oid)

    return out


def _refine_clusters_with_strict_merge(clusters: list, id_to_record: dict) -> list:
    """
    Re-merge each multi-article row using strict headline rules.
    Splits loose AI (or old heuristic) groups so unrelated stories don't share a horizontal row.
    """
    generic_perspectives = {
        "left": "Coverage emphasizes accountability, civil impacts, and institutional response.",
        "center": "Coverage emphasizes confirmed facts, procedures, and official statements.",
        "right": "Coverage emphasizes security, trade-offs, and critiques of policy or narrative.",
    }
    refined = []
    for c in clusters or []:
        ids = [x for x in (c.get("article_ids") or []) if x in id_to_record]
        if len(ids) <= 1:
            refined.append(c)
            continue
        sub_records = [id_to_record[i] for i in ids]
        sub_clusters = _heuristic_event_clusters(sub_records)
        if len(sub_clusters) <= 1:
            refined.append(c)
            continue
        base_id = str(c.get("id") or "cluster")
        for k, sc in enumerate(sub_clusters):
            refined.append({
                "id": f"{base_id}-e{k + 1}",
                "title": sc["title"],
                "timestamp": str(c.get("timestamp") or ""),
                "article_ids": sc["article_ids"],
                "perspectives": sc.get("perspectives") or dict(generic_perspectives),
            })
    return refined


def _maybe_split_large_clusters(clusters: list, id_to_record: dict, min_articles: int = 5) -> list:
    """If AI returned one huge row, split by headline similarity."""
    if len(clusters) != 1:
        return clusters
    ids = clusters[0].get("article_ids") or []
    if len(ids) < min_articles:
        return clusters
    sub_records = [id_to_record[i] for i in ids if i in id_to_record]
    if len(sub_records) < min_articles:
        return clusters
    split = _heuristic_event_clusters(sub_records)
    if len(split) <= 1:
        return clusters
    return split


async def build_clustered_payload(records: list):
    id_to_record: dict[str, dict] = {}
    ordered_article_ids: list[str] = []
    for record in records:
        article_id = str(record.get("article_id") or record.get("id") or "")
        if not article_id or article_id in id_to_record:
            continue
        id_to_record[article_id] = record
        ordered_article_ids.append(article_id)

    article_contexts = []
    for record in records[:20]:
        article_id = str(record.get("article_id") or record.get("id") or "")
        if not article_id:
            continue
        link = record.get("link") or ""
        scraped_text = ""
        try:
            downloaded = trafilatura.fetch_url(link) if link else None
            scraped_text = trafilatura.extract(downloaded) if downloaded else ""
        except Exception:
            scraped_text = ""

        excerpt = (scraped_text or "")[:1800]
        quote_candidates = extract_quote_candidates(excerpt)
        article_contexts.append({
            "article_id": article_id,
            "title": record.get("title", ""),
            "source": record.get("source", ""),
            "date": record.get("date", ""),
            "link": link,
            "bias_left": record.get("bias_left", 0),
            "bias_center": record.get("bias_center", 0),
            "bias_right": record.get("bias_right", 0),
            "scraped_excerpt": excerpt,
            "quote_candidates": quote_candidates,
        })

    clusters: list = []
    raw_clusters: list = []
    try:
        if article_contexts and HAS_INFORGE:
            ai_payload = await insforge.cluster_topics_with_summaries(article_contexts)
            raw_clusters = ai_payload.get("clusters", []) if isinstance(ai_payload, dict) else []
    except Exception as e:
        print(f"Cluster generation failed, using heuristic event rows: {e}")
        raw_clusters = []

    if raw_clusters:
        clusters = _sanitize_and_complete_clusters(raw_clusters, ordered_article_ids, id_to_record)
        clusters = _maybe_split_large_clusters(clusters, id_to_record)
    else:
        clusters = _heuristic_event_clusters(records)
        clusters = _sanitize_and_complete_clusters(clusters, ordered_article_ids, id_to_record)

    # Tighten every multi-article row so unrelated headlines don't share one carousel.
    clusters = _refine_clusters_with_strict_merge(clusters, id_to_record)

    # Rows with more sources (same event, many outlets) first; then stable order.
    clusters.sort(key=lambda c: (-len(c.get("article_ids") or []), str(c.get("id") or "")))

    return {
        "status": "success",
        "articles": records,
        "clusters": clusters,
    }

# --- AUTOMATION LOGIC ---

async def sync_news_to_db():
    """Main task: Fetch (Filtered) -> Scrape -> AI -> Clean -> Save"""
    print("Starting Filtered News Sync (US Politics Only)...")

    # If env vars aren't configured yet, don't spam failures. The UI can still start
    # and will just show "no news available" until backend is fully configured.
    if not HAS_INFORGE or not HAS_NEWSDATA:
        print("Missing env vars (INSFORGE / NEWSDATA). Skipping sync.")
        return
    
    # Updated params for strict filtering
    params = {
        "apikey": NEWSDATA_API_KEY,
        "language": "en", 
        "category": "politics", # Only political news
        "country": "us"         # Only US-based sources
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        # Latest endpoint ensures you get the most recent breaking news
        resp = await client.get("https://newsdata.io/api/1/latest", params=params)
        raw_articles = resp.json().get('results', [])[:10]
    
    # ... rest of your scraping and AI logic remains the same ...

    db_entries = []
    for article in raw_articles:
        # Add this inside your 'for article in raw_articles:' loop
        title = article.get('title', '').lower()
        skip_keywords = ['listings', 'ratings', 'stocks', 'forecast', 'horoscope']

        if any(word in title for word in skip_keywords):
            print(f"Skipping non-political item: {title[:30]}")
            continue
        url = article.get('link')
        title = article.get('title', 'Untitled')
        
        # Scrape Text
        scraped_text = ""
        try:
            downloaded = trafilatura.fetch_url(url)
            scraped_text = trafilatura.extract(downloaded) if downloaded else ""
        except: pass

        text = (scraped_text if len(scraped_text) > 100 else article.get('description', ''))[:2000]
        
        # AI Analysis
        bias = {"left": 0, "center": 100, "right": 0}
        if len(text.strip()) > 20:
            try:
                bias = await insforge.analyze_bias(text)
                print(f"Bias analyzed for: {title[:40]}...")
            except Exception as e:
                print(f"AI Error for {title}: {e}")

        article_id = article.get("article_id") or article.get("link") or title
        db_entries.append({
            "article_id": article_id,
            "title": title,
            "link": url,
            "image": article.get("image_url"),
            "source": article.get("source_name"),
            "date": article.get("pubDate"),
            "bias_left": bias['left'],
            "bias_center": bias['center'],
            "bias_right": bias['right']
        })

    # Execute Database Sync
    try:
        # We clear first to ensure we only have the freshest 10 articles
        await insforge.clear_news()
        await insforge.save_records(db_entries)
        print(f"Saved {len(db_entries)} fresh articles to database.")
    except Exception as e:
        print(f"Database Sync Failed: {e}")

async def news_worker():
    """Background loop: Immediate run, then 12-hour cycle"""
    while True:
        try:
            await sync_news_to_db()
        except Exception as e:
            print(f"Worker Error: {e}")
        await asyncio.sleep(43200) # 12 hours

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Starts the background worker as soon as the server launches
    asyncio.create_task(news_worker())
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/news")
async def get_news():
    """Returns news from the DB instantly for the UI"""
    try:
        if not HAS_INFORGE:
            return {
                "status": "success",
                "articles": [],
                "clusters": [],
                "warning": "INSFORGE env vars not configured yet",
            }

        articles = await insforge.get_records()
        return await build_clustered_payload(articles)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))