# pol-news

> See the same story through every lens. AI-powered political news bias analysis across multiple sources.

pol-news clusters US political news stories from different outlets and uses Claude AI to analyze the political lean of each article — giving you a left/center/right breakdown so you can see how different publishers frame the same event.

---

## Features

- **Bias Meter** — Visual left/center/right percentage breakdown for every article
- **Live search** — Real-time search with on-the-fly AI bias analysis
- **Auto-refresh** — Background pipeline fetches and analyzes new articles every 12 hours

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm (or pnpm)
- API keys for NewsData.io and InsForge

### Environment Variables

Create a `.env` file in the project root:

```env
NEWSDATA_API_KEY=your_newsdata_api_key
INSFORGE_BASE_URL=your_insforge_base_url
INSFORGE_API_KEY=your_insforge_api_key
```

### Backend

```bash
pip install -r requirements.txt
uvicorn api.news:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api/*` requests to the backend at port 8000.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/news` | Returns stored clustered articles from the database |
| `GET` | `/api/search?q=<query>` | Live search with real-time bias analysis |
