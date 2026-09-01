// FILE: frontend/src/components/DataMatrixTable.tsx
import React from "react";
import Link from "next/link";

export interface MatchRow {
  id: number;
  date: string;
  opponent: string;
  competition: string;
  isHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
  topScorer?: string;
  xG?: number | null;
}

interface DataMatrixTableProps {
  title?: string;
  subtitle?: string;
  matches: MatchRow[];
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

export default function DataMatrixTable({
  title = "Historical Match Matrix",
  subtitle = "100-Year Manchester United Match Archives",
  matches,
  currentPage,
  totalPages,
  baseUrl = "/matches",
}: DataMatrixTableProps) {
  return (
    <section className="w-full max-w-5xl mx-auto rounded-2xl bg-brand-slate/90 border border-brand-border p-6 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-brand-border/60 gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-red inline-block" />
            {title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-xs font-semibold text-gray-400 bg-brand-carbon px-3 py-1.5 rounded-lg border border-brand-border/80 self-start md:self-auto">
          Page {currentPage} of {Math.max(1, totalPages)}
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="w-full overflow-x-auto mt-4">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="text-[11px] uppercase tracking-wider text-gray-400 bg-brand-carbon/60 border-b border-brand-border">
            <tr>
              <th scope="col" className="py-3.5 px-4 font-semibold">Date</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Competition</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Venue</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Opponent</th>
              <th scope="col" className="py-3.5 px-4 font-semibold text-center">Result</th>
              <th scope="col" className="py-3.5 px-4 font-semibold text-right">xG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {matches.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                  No match archives found for this query.
                </td>
              </tr>
            ) : (
              matches.map((match) => {
                const isWin = match.goalsFor > match.goalsAgainst;
                const isDraw = match.goalsFor === match.goalsAgainst;
                const resultLetter = isWin ? "W" : isDraw ? "D" : "L";
                const resultBadgeColor = isWin
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : isDraw
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-brand-red/10 text-brand-red border-brand-red/30";

                return (
                  <tr
                    key={match.id}
                    className="hover:bg-brand-carbon/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-300 whitespace-nowrap">
                      {new Date(match.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-400 whitespace-nowrap">
                      <span className="bg-brand-carbon px-2 py-0.5 rounded border border-brand-border/60 text-gray-300">
                        {match.competition}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-400">
                      {match.isHome ? (
                        <span className="text-brand-red">H</span>
                      ) : (
                        <span className="text-gray-400">A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-sm font-semibold text-white whitespace-nowrap group-hover:text-brand-red transition-colors">
                      {match.opponent}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${resultBadgeColor}`}
                        >
                          {resultLetter}
                        </span>
                        <span className="font-display text-lg font-bold text-white tracking-wider">
                          {match.goalsFor} - {match.goalsAgainst}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-right text-brand-gold font-display text-base font-bold">
                      {match.xG != null ? match.xG.toFixed(2) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-5 mt-4 border-t border-brand-border/60">
        {currentPage > 1 ? (
          <Link
            href={`${baseUrl}?page=${currentPage - 1}`}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-brand-carbon border border-brand-border text-gray-300 hover:bg-brand-red hover:text-white hover:border-brand-red transition-colors"
          >
            ← Previous
          </Link>
        ) : (
          <span className="text-xs font-semibold px-4 py-2 rounded-lg bg-brand-carbon/40 border border-brand-border/40 text-gray-600 cursor-not-allowed">
            ← Previous
          </span>
        )}

        <span className="text-xs text-gray-400">
          Showing page {currentPage} of {Math.max(1, totalPages)}
        </span>

        {currentPage < totalPages ? (
          <Link
            href={`${baseUrl}?page=${currentPage + 1}`}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-brand-carbon border border-brand-border text-gray-300 hover:bg-brand-red hover:text-white hover:border-brand-red transition-colors"
          >
            Next →
          </Link>
        ) : (
          <span className="text-xs font-semibold px-4 py-2 rounded-lg bg-brand-carbon/40 border border-brand-border/40 text-gray-600 cursor-not-allowed">
            Next →
          </span>
        )}
      </div>
    </section>
  );
}