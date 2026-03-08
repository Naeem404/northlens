import type { Metadata } from "next";
import { Fraunces, Outfit, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const body = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NorthLens — Cartographic Intelligence for Canadian Markets",
  description:
    "Precision data pipelines and market intelligence instruments for Canadian businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${heading.variable} ${body.variable} ${mono.variable} antialiased`}
      >
        <QueryProvider>
          <TooltipProvider delay={300}>
            {children}
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
