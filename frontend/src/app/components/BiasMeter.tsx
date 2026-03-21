import { BiasScore } from '../data/mockData';

interface BiasMetProps {
  bias: BiasScore;
  className?: string;
}

export function BiasMeter({ bias, className = '' }: BiasMetProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between text-xs font-['Inter'] text-gray-600">
        <span>Left</span>
        <span>Center</span>
        <span>Right</span>
      </div>
      <div className="h-2 w-full flex rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${bias.left}%`,
            backgroundColor: '#2563EB',
          }}
        />
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${bias.center}%`,
            backgroundColor: '#94A3B8',
          }}
        />
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${bias.right}%`,
            backgroundColor: '#DC2626',
          }}
        />
      </div>
      <div className="flex justify-between text-xs font-['Inter'] font-medium">
        <span style={{ color: '#2563EB' }}>{bias.left}%</span>
        <span style={{ color: '#94A3B8' }}>{bias.center}%</span>
        <span style={{ color: '#DC2626' }}>{bias.right}%</span>
      </div>
    </div>
  );
}
