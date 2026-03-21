import type { AggregateResult } from '../types';
import BiasBar from './BiasBar';

interface Props {
  aggregate: AggregateResult;
  query: string;
}

export default function AggregateBias({ aggregate, query }: Props) {
  const { weighted_bias, total_articles } = aggregate;

  // Determine dominant lean
  const max = Math.max(weighted_bias.left, weighted_bias.center, weighted_bias.right);
  let dominant = 'Balanced';
  if (max === weighted_bias.left && weighted_bias.left > 40) dominant = 'Left-leaning';
  else if (max === weighted_bias.right && weighted_bias.right > 40) dominant = 'Right-leaning';
  else if (max === weighted_bias.center && weighted_bias.center > 40) dominant = 'Centrist';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Coverage bias for &ldquo;{query}&rdquo;
        </h2>
        <span className="text-sm text-slate-500">{total_articles} articles</span>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Aggregate lean: <strong className="text-slate-700">{dominant}</strong>
      </p>
      <BiasBar bias={weighted_bias} size="lg" showLabels />
    </div>
  );
}
