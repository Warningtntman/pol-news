import { useState, type FormEvent } from 'react';

interface Props {
  onSearch: (query: string, description: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: Props) {
  const [query, setQuery] = useState('');
  const [description, setDescription] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim(), description.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a topic (e.g. immigration, Ukraine war)..."
          disabled={isLoading}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-base shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Analyzing…' : 'Search'}
        </button>
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional: describe the topic for better bias context (e.g. 'Coverage of the 2026 US-Iran conflict focusing on military strategy')"
        disabled={isLoading}
        rows={2}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-60 resize-none text-slate-600 placeholder:text-slate-400"
      />
    </form>
  );
}
