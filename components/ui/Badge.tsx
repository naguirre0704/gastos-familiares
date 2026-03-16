interface BadgeProps {
  label: string;
  emoji?: string;
  color?: string;
  className?: string;
}

export function Badge({ label, emoji, color = "#6B7280", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {emoji && <span>{emoji}</span>}
      {label}
    </span>
  );
}
