import React from 'react';
import { generateBarcodeBars } from '../utils/helpers';

interface BarcodeRendererProps {
  value: string;
  label?: string;
  showText?: boolean;
  height?: number;
  barWidth?: number;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  label,
  showText = true,
  height = 42,
  barWidth = 1.8,
  className = '',
}) => {
  const bars = generateBarcodeBars(value);
  const totalWidth = bars.length * barWidth;

  return (
    <div className={`inline-flex flex-col items-center select-none bg-white p-1 rounded ${className}`}>
      {label && (
        <span className="text-[10px] font-semibold text-slate-700 tracking-tight text-center max-w-[140px] truncate mb-0.5">
          {label}
        </span>
      )}
      <svg
        width={totalWidth}
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="shape-rendering-crispEdges"
      >
        <rect width={totalWidth} height={height} fill="#FFFFFF" />
        {bars.map((isBlack, index) =>
          isBlack ? (
            <rect
              key={index}
              x={index * barWidth}
              y={0}
              width={barWidth}
              height={height}
              fill="#000000"
            />
          ) : null
        )}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] tracking-widest text-slate-800 font-semibold mt-0.5">
          {value}
        </span>
      )}
    </div>
  );
};
