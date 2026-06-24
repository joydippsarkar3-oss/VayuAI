"use client";

/**
 * Lightweight inline SVG weather icons (no icon-library dependency).
 * Conditions map to the normalised condition codes from the fusion schema.
 */

type IconProps = { className?: string };

export function WeatherIcon({
  condition,
  className = "h-8 w-8",
}: {
  condition: string;
  className?: string;
}) {
  switch (condition) {
    case "clear":
      return <SunIcon className={className} />;
    case "partly-cloudy":
      return <SunCloudIcon className={className} />;
    case "cloudy":
    case "humid":
      return <CloudIcon className={className} />;
    case "rain":
      return <RainIcon className={className} />;
    case "thunderstorm":
      return <StormIcon className={className} />;
    case "snow":
      return <SnowIcon className={className} />;
    case "windy":
      return <WindIcon className={className} />;
    default:
      return <CloudIcon className={className} />;
  }
}

export function SunIcon({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="5" fill="#fbbf24" />
      <g stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1.5" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22.5" />
        <line x1="1.5" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22.5" y2="12" />
        <line x1="4.2" y1="4.2" x2="6" y2="6" />
        <line x1="18" y1="18" x2="19.8" y2="19.8" />
        <line x1="4.2" y1="19.8" x2="6" y2="18" />
        <line x1="18" y1="6" x2="19.8" y2="4.2" />
      </g>
    </svg>
  );
}

export function CloudIcon({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 18a4 4 0 010-8 5.5 5.5 0 0110.5-1.5A4 4 0 0117 18H7z"
        fill="#94a3b8"
      />
    </svg>
  );
}

export function SunCloudIcon({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="8" cy="9" r="3.2" fill="#fbbf24" />
      <path
        d="M10 18a3.2 3.2 0 010-6.4 4.4 4.4 0 018.4-1.2A3.2 3.2 0 0118 18H10z"
        fill="#cbd5e1"
      />
    </svg>
  );
}

export function RainIcon({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 15a4 4 0 010-8 5.5 5.5 0 0110.5-1.5A4 4 0 0117 15H7z"
        fill="#94a3b8"
      />
      <g stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round">
        <line x1="8" y1="17" x2="7" y2="21" />
        <line x1="12" y1="17" x2="11" y2="21" />
        <line x1="16" y1="17" x2="15" y2="21" />
      </g>
    </svg>
  );
}

export function StormIcon({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 14a4 4 0 010-8 5.5 5.5 0 0110.5-1.5A4 4 0 0117 14H7z"
        fill="#64748b"
      />
      <path d="M12 14l-3 5h3l-1 4 4-6h-3l1-3z" fill="#facc15" />
    </svg>
  );
}

export function SnowIcon({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 15a4 4 0 010-8 5.5 5.5 0 0110.5-1.5A4 4 0 0117 15H7z"
        fill="#cbd5e1"
      />
      <g fill="#e0f2fe">
        <circle cx="8" cy="19" r="1.2" />
        <circle cx="12" cy="20" r="1.2" />
        <circle cx="16" cy="19" r="1.2" />
      </g>
    </svg>
  );
}

export function WindIcon({ className = "h-8 w-8" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3 8h11a2.5 2.5 0 100-5M3 12h15a2.5 2.5 0 110 5M3 16h9"
        stroke="#94a3b8"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
