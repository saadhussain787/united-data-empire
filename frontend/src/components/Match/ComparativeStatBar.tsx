import React from 'react';

interface ComparativeStatBarProps {
  label: string;
  homeVal: number | string;
  awayVal: number | string;
  homeColorClass?: string;
  awayColorClass?: string;
  isPercentage?: boolean;
  reverse?: boolean;
}

export const ComparativeStatBar: React.FC<ComparativeStatBarProps> = ({
  label,
  homeVal,
  awayVal,
  homeColorClass = "bg-[#DA291C]",
  awayColorClass = "bg-[#1E40AF]",
  isPercentage = false,
  reverse = false,
}) => {
  const numHome = typeof homeVal === "string" ? parseFloat(homeVal) : homeVal;
  const numAway = typeof awayVal === "string" ? parseFloat(awayVal) : awayVal;
  const absHome = Math.abs(numHome) || 0;
  const absAway = Math.abs(numAway) || 0;
  const total = absHome + absAway || 1;
  
  let homePct = (absHome / total) * 100;
  let awayPct = (absAway / total) * 100;

  if (reverse) {
    const temp = homePct;
    homePct = awayPct;
    awayPct = temp;
  }

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-gray-300">
          {homeVal}
          {isPercentage && !String(homeVal).includes('%') && "%"}
        </span>
        <span className="text-gray-400 uppercase text-[10px] tracking-wider text-center flex-1">{label}</span>
        <span className="text-gray-300">
          {awayVal}
          {isPercentage && !String(awayVal).includes('%') && "%"}
        </span>
      </div>
      <div className="w-full h-2 bg-black/40 rounded-full flex overflow-hidden border border-white/5">
        <div className={`${homeColorClass} rounded-l-full rounded-r-none h-full transition-all duration-700`} style={{ width: `${homePct}%` }} />
        <div className={`${awayColorClass} rounded-r-full rounded-l-none h-full transition-all duration-700 flex-1`} />
      </div>
    </div>
  );
};
