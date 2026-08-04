import { Star } from "lucide-react";

export function Rating({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const full = Math.floor(value);
  const starSize = size === "md" ? "size-4" : "size-3.5";

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5 text-primary" aria-label={`${value} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${starSize} ${i < full ? "fill-primary" : "fill-transparent opacity-35"}`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-foreground">{value.toFixed(1)}</span>
      {typeof count === "number" && (
        <span className="text-xs text-[var(--accent)]">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}
