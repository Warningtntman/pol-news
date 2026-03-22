import { BiasScore } from '../data/mockData';

const LEFT = '#2563EB';
const CENTER = '#94A3B8';
const RIGHT = '#DC2626';

interface BiasMetProps {
  bias: BiasScore;
  className?: string;
}

export function BiasMeter({ bias, className = '' }: BiasMetProps) {
  return (
    <div className={`font-['Inter'] flex flex-col gap-1.5 ${className}`}>
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        <div
          className="h-full min-w-0 transition-all duration-300"
          style={{
            width: `${bias.left}%`,
            backgroundColor: LEFT,
          }}
        />
        <div
          className="h-full min-w-0 transition-all duration-300"
          style={{
            width: `${bias.center}%`,
            backgroundColor: CENTER,
          }}
        />
        <div
          className="h-full min-w-0 transition-all duration-300"
          style={{
            width: `${bias.right}%`,
            backgroundColor: RIGHT,
          }}
        />
      </div>
      <div className="grid grid-cols-3 gap-1 text-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Left
          </span>
          <span className="text-xs font-semibold" style={{ color: LEFT }}>
            {bias.left}%
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Center
          </span>
          <span className="text-xs font-semibold" style={{ color: CENTER }}>
            {bias.center}%
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Right
          </span>
          <span className="text-xs font-semibold" style={{ color: RIGHT }}>
            {bias.right}%
          </span>
        </div>
      </div>
    </div>
  );
}
