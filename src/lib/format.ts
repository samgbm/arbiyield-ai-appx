import type { PricingModel } from "./types";

export function formatPrice(price: number, model: PricingModel): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);

  if (model === "subscription") return `${formatted}/mo`;
  if (model === "usage") return `${formatted}/1k runs`;
  return formatted;
}

export function formatUsers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export function categoryLabel(slug: string): string {
  const labels: Record<string, string> = {
    coding: "Coding",
    research: "Research",
    support: "Customer Support",
    marketing: "Marketing",
    trading: "Trading",
    design: "Design",
    ops: "Operations",
    education: "Education",
  };
  return labels[slug] ?? slug;
}
