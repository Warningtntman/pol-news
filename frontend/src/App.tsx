import { useSearch } from './hooks/useSearch';
import SearchBar from './components/SearchBar';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBanner from './components/ErrorBanner';
import AggregateBias from './components/AggregateBias';
import SourceBreakdown from './components/SourceBreakdown';
import ArticleList from './components/ArticleList';

function App() {
  const { data, isLoading, error, lastQuery, search } = useSearch();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-5">
          <h1 className="text-2xl font-bold text-slate-900">
            News Bias Detector
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Search a topic to see the political lean of news coverage across sources.
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <SearchBar onSearch={(q, d) => search(q, d)} isLoading={isLoading} />
        </div>

        {/* Loading */}
        {isLoading && <LoadingSpinner />}

        {/* Hard error */}
        {error && <ErrorBanner message={error} />}

        {/* Results */}
        {data && !isLoading && (
          <div className="flex flex-col gap-6">
            {/* Partial analysis warnings */}
            {data.errors.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700 text-sm">
                <strong>Note:</strong> Bias analysis was unavailable for {data.errors.length} article{data.errors.length !== 1 ? 's' : ''}.
              </div>
            )}

            {/* Aggregate bias */}
            <AggregateBias aggregate={data.aggregate} query={lastQuery} />

            {/* Source breakdown */}
            <SourceBreakdown sources={data.sources} />

            {/* Article list */}
            <ArticleList articles={data.articles} />
          </div>
        )}

        {/* Empty state (first load) */}
        {!data && !isLoading && !error && (
          <div className="py-16 text-center text-slate-400">
            <p className="text-lg">Enter a topic above to get started.</p>
            <p className="mt-2 text-sm">
              Try &ldquo;immigration&rdquo;, &ldquo;climate change&rdquo;, or &ldquo;Ukraine&rdquo;.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
