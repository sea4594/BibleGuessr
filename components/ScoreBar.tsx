'use client';

type Props = {
  score: number;
  className?: string;
  label?: string;
};

export default function ScoreBar({ score, className = '', label = 'Score' }: Props) {
  const percent = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div
      className={`score-bar ${className}`.trim()}
      aria-label={`${label}: ${percent}%`}
      role="img"
      style={{
        background: `linear-gradient(90deg, #22c55e 0%, #22c55e ${percent}%, #ef4444 ${percent}%, #ef4444 100%)`,
      }}
    />
  );
}
