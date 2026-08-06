import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prediction Markets",
  description:
    "ArbiYield Prediction Markets hub — discover, create, and trade events on Arbitrum Stylus.",
};

export default function MarketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
