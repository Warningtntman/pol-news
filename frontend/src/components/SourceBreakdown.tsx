import { useState } from 'react';
import type { SourceBreakdown as SourceBreakdownType } from '../types';
import BiasBar from './BiasBar';

interface Props {
  sources: SourceBreakdownType[];
}

export default function SourceBreakdown({ sources }: Props) {
  const [open, setOpen] = useState(true);

  if (sources.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <h3 className="text-base font-semibold text-slate-800">
          By source <span className="ml-1 text-sm font-normal text-slate-400">({sources.length})</span>
        </h3>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="divide-y divide-slate-100 border-t border-slate-100">
          {sources.map((s) => (
            <div key={s.source_id} className="px-6 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-slate-700 text-sm">{s.source_name}</span>
                <span className="text-xs text-slate-400">
                  {s.article_count} article{s.article_count !== 1 ? 's' : ''}
                </span>
              </div>
              <BiasBar bias={s.average_bias} size="sm" showLabels />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
