"use client";

import type { SourceId } from "@/lib/fusion/schema";
import { SOURCE_LABELS, SOURCE_ORDER } from "@/lib/fusion/schema";

/**
 * Source-agreement indicator — PRD §6.1.
 * Shows which sources contributed to today's forecast and, for rain, how many agree.
 */
export function SourceAgreement({
  sourcesUsed,
  sourcesFailed,
  rainAgreement,
}: {
  sourcesUsed: SourceId[];
  sourcesFailed: SourceId[];
  rainAgreement: { agree: number; total: number };
}) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Multi-source fusion</h3>
        <span className="text-xs text-slate-500">
          {sourcesUsed.length} source{sourcesUsed.length !== 1 ? "s" : ""} active
        </span>
      </div>

      <div className="space-y-1.5">
        {SOURCE_ORDER.map((id) => {
          const ok = sourcesUsed.includes(id);
          return (
            <div key={id} className="flex items-center justify-between text-sm">
              <span className={ok ? "text-slate-700" : "text-slate-400 line-through"}>
                {SOURCE_LABELS[id]}
              </span>
              {ok ? (
                <span className="chip bg-leaf-100 text-leaf-600">live</span>
              ) : (
                <span className="chip bg-red-100 text-red-600" title={sourcesFailed.includes(id) ? "unavailable" : ""}>
                  down
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg bg-sky-50 p-2.5 text-center">
        <div className="text-2xl font-bold text-sky-700">
          {rainAgreement.agree}/{rainAgreement.total}
        </div>
        <div className="text-xs text-slate-600">sources predict rain today</div>
      </div>
    </div>
  );
}
