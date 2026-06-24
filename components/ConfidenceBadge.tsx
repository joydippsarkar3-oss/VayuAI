"use client";

/**
 * Confidence badge — PRD §5.1 Step 5.
 * Score < 50 is displayed with a warning ("Low confidence, check back later").
 */
export function ConfidenceBadge({ score }: { score: number }) {
  const { label, classes } = band(score);
  return (
    <span
      className={`chip ${classes}`}
      title={`AI confidence: ${score}/100 — based on inter-source agreement, coverage and horizon.`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {score < 50 ? "Low confidence · " : ""}
      {label} {score}%
    </span>
  );
}

function band(score: number): { label: string; classes: string } {
  if (score >= 75) return { label: "High confidence", classes: "bg-leaf-100 text-leaf-600" };
  if (score >= 50) return { label: "Moderate", classes: "bg-saffron-100 text-saffron-600" };
  return { label: "check back later", classes: "bg-red-100 text-red-700" };
}
