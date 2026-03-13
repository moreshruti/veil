import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import { Toaster } from "react-hot-toast";
import { Web3Provider } from "@/components/wallet/Web3Provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veil -- Talk to your money. No one else can.",
  description:
    "Veil is an AI-powered private DeFi agent. You chat. It acts. No trace. Execute swaps, bridges, and DeFi operations through natural language with full on-chain privacy.",
  keywords: [
    "DeFi",
    "privacy",
    "AI agent",
    "blockchain",
    "Ethereum",
    "private transactions",
  ],
  authors: [{ name: "Veil" }],
  openGraph: {
    title: "Veil -- Talk to your money. No one else can.",
    description:
      "AI-powered private DeFi agent. You chat. It acts. No trace.",
    type: "website",
    siteName: "Veil",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veil -- Talk to your money. No one else can.",
    description:
      "AI-powered private DeFi agent. You chat. It acts. No trace.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} antialiased`}
      >
        <Web3Provider>
          {children}
        </Web3Provider>
        <Toaster />
      </body>
    </html>
  );
}
