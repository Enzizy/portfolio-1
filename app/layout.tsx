import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { GeistSans } from "geist/font/sans";
import { CatChat } from "@/components/CatChat";
import { PortfolioSplash } from "@/components/PortfolioSplash";
import { TargetCursor } from "@/components/TargetCursor";
import { ThemeTransition } from "@/components/ThemeTransition";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Zhyronne Batican — Full Stack Developer",
  description:
    "Full stack developer building web apps, WordPress sites, landing pages, mobile tools, and AI-assisted workflows.",
  keywords: ["Full Stack Developer", "WordPress Developer", "Landing Pages", "AI Engineer", "UI/UX Designer", "Zhyronne Batican"],
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "UXmgTovg7upSW0wO0GCwRdK0flSNkupoRxaN0obTeQM",
  },
  openGraph: {
    title: "Zhyronne Batican — Full Stack Developer",
    description: "Web apps, WordPress sites, landing pages, mobile tools, and AI-assisted workflows.",
    type: "website",
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Zhyronne Batican portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zhyronne Batican — Full Stack Developer",
    description: "Web apps, WordPress sites, landing pages, mobile tools, and AI-assisted workflows.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem('portfolio-theme');document.documentElement.dataset.theme=saved==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})();`,
          }}
        />
      </head>
      <body id="top" className={GeistSans.className}>
        <noscript><style>{".portfolio-splash{display:none!important}"}</style></noscript>
        <PortfolioSplash />
        <TargetCursor />
        <ThemeTransition />
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
        <CatChat />
        <Analytics />
      </body>
    </html>
  );
}
