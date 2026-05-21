import type { Metadata } from "next";

import "@/app/globals.css";

import { Space_Grotesk, JetBrains_Mono, Inter } from "next/font/google";

import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"] });

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Smart Waste Ops",
  description: "Operational control for municipal smart waste fleets",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`}>
      <body className={`${inter.className} bg-[#0A0F1E]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
