export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      <p className="text-sm">Fetching articles and analyzing bias…</p>
    </div>
  );
}
