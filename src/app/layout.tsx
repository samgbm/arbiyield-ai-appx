import type { Metadata } from "next";
import {
  Instrument_Serif,
  Plus_Jakarta_Sans,
  Roboto,
  Roboto_Mono,
} from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

/** Explorer-style UI font (Etherscan / Arbiscan). */
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "ArbiYield AI — Stylus + Generative Yield",
    template: "%s · ArbiYield AI",
  },
  description:
    "Arbitrum Scaffold-Stylus + Generative AI hackathon app: prompt strategies, generative UI, execute on Arbitrum Sepolia.",
  metadataBase: new URL("https://arbiyield-ai-appx.vercel.app"),
  openGraph: {
    title: "ArbiYield AI",
    description:
      "Generative yield strategies on Arbitrum Stylus — ETH Lima 2026.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} ${robotoMono.variable} ${jakarta.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
