// FILE: frontend/src/components/PlayerCard.tsx
import React from "react";
import Image from "next/image";

export interface PlayerData {
  id: number;
  name: string;
  position: string;
  nationality: string;
  headshotUrl?: string | null;
  squadNumber?: number | string;
  era?: string;
  appearances?: number;
  goals?: number;
  isLegend?: boolean;
}

interface PlayerCardProps {
  player: PlayerData;
}

export function LegendCard({ player }: { player: PlayerData }) {
  const numberDisplay = player.squadNumber ? `${player.squadNumber}` : "★";
  const nameParts = player.name.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || player.name;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  return (
    <div className="relative group w-full max-w-[220px] aspect-[3/4] rounded-xl bg-gradient-to-b from-brand-slate via-brand-carbon to-black border-2 border-brand-gold/40 hover:border-brand-gold p-4 transition-all duration-300 shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col justify-between mx-auto">
      <div className="flex items-center justify-between z-10">
        <span className="text-[9px] font-bold tracking-widest uppercase bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded border border-brand-gold/40">
          Legend
        </span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <span className="font-display text-[120px] font-bold text-brand-gold">
          {numberDisplay}
        </span>
      </div>
      <div className="z-10 mt-auto pt-4 bg-gradient-to-t from-black via-black/80 to-transparent -mx-4 -mb-4 p-4">
        <span className="font-display text-4xl font-extrabold text-brand-gold block leading-none tracking-tight">
          {numberDisplay}
        </span>
        <div className="mt-1">
          {lastName ? (
            <>
              <span className="text-[10px] text-gray-400 font-medium block leading-tight">
                {firstName}
              </span>
              <span className="text-base font-bold text-white block leading-tight uppercase tracking-wide group-hover:text-brand-gold transition-colors">
                {lastName}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-white block leading-tight uppercase tracking-wide group-hover:text-brand-gold transition-colors">
              {player.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlayerCard({ player }: PlayerCardProps) {
  if (player.isLegend || !player.headshotUrl) {
    return <LegendCard player={player} />;
  }

  const numberDisplay = player.squadNumber ? `${player.squadNumber}` : "";
  const nameParts = player.name.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || player.name;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  return (
    <div className="relative group w-full max-w-[220px] aspect-[3/4] rounded-xl bg-gradient-to-b from-[#1c1c1e] via-[#121214] to-black border border-brand-border hover:border-brand-red/60 transition-all duration-300 shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col justify-end mx-auto">
      <div className="absolute inset-0 w-full h-full flex justify-center pt-2">
        {/* Changed object-cover to object-contain so low-res images aren't stretched */}
        <div className="relative w-[150px] h-[150px]"> 
          <Image
            src={player.headshotUrl}
            alt={player.name}
            fill
            unoptimized
            className="object-contain group-hover:scale-105 transition-transform duration-500"
            priority={false}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 p-4">
        {numberDisplay && (
          <span className="font-display text-4xl font-extrabold text-white block leading-none tracking-tight drop-shadow-md group-hover:text-brand-red transition-colors">
            {numberDisplay}
          </span>
        )}
        <div className="mt-1">
          {lastName ? (
            <>
              <span className="text-[10px] text-gray-300 font-medium block leading-tight drop-shadow">
                {firstName}
              </span>
              <span className="text-base font-bold text-white block leading-tight uppercase tracking-wide drop-shadow-md">
                {lastName}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-white block leading-tight uppercase tracking-wide drop-shadow-md">
              {player.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}