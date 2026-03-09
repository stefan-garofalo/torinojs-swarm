import type { Metadata } from "next";
import { env } from "@reaping/env/web";

import { IBM_Plex_Mono, Silkscreen } from "next/font/google";

import "../index.css";
import Header from "@/modules/ui/header";
import Providers from "@/modules/app/providers";

const reapingDisplay = Silkscreen({
  variable: "--font-reaping-display",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const reapingMono = IBM_Plex_Mono({
  variable: "--font-reaping-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: "The Reaping",
  description: "Retro-dark UI foundation for the TorinoJS Reaping demo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${reapingDisplay.variable} ${reapingMono.variable} antialiased`}>
        <Providers>
          <div className="relative z-10 grid min-h-svh grid-rows-[auto_1fr]">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
