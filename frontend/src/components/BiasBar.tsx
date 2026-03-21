import type { BiasResult } from '../types';

interface Props {
  bias: BiasResult;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const heights: Record<string, string> = {
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
};

const textSizes: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
};

export default function BiasBar({ bias, size = 'md', showLabels = true }: Props) {
  const h = heights[size];
  const ts = textSizes[size];

  return (
    <div className="w-full">
      {/* Color bar — inline style for pixel-accurate proportions */}
      <div className={`flex w-full rounded overflow-hidden ${h}`} title={`Left ${bias.left}% · Center ${bias.center}% · Right ${bias.right}%`}>
        {bias.left > 0 && (
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${bias.left}%` }}
            title={`Left: ${bias.left}%`}
          />
        )}
        {bias.center > 0 && (
          <div
            className="bg-slate-400 transition-all"
            style={{ width: `${bias.center}%` }}
            title={`Center: ${bias.center}%`}
          />
        )}
        {bias.right > 0 && (
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${bias.right}%` }}
            title={`Right: ${bias.right}%`}
          />
        )}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className={`flex justify-between mt-1 ${ts} text-slate-500`}>
          <span className="text-blue-600 font-medium">Left {bias.left}%</span>
          <span className="text-slate-500">Center {bias.center}%</span>
          <span className="text-red-600 font-medium">Right {bias.right}%</span>
        </div>
      )}
    </div>
  );
}
