import { useState, type FormEvent } from 'react';

interface Props {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: Props) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search a topic (e.g. immigration, Ukraine war)..."
        disabled={isLoading}
        className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-base shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Analyzing…' : 'Search'}
      </button>
    </form>
  );
}
