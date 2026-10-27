import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { CatChat } from "@/components/CatChat";
import { CursorSkin } from "@/components/CursorSkin";
import { PortfolioSplash } from "@/components/PortfolioSplash";
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
    // First key: the old vercel.app property. Second: portfolio.zhyronnebatican.workers.dev.
    google: ["UXmgTovg7upSW0wO0GCwRdK0flSNkupoRxaN0obTeQM", "92PhbgmH9ULunrd8WSZldCW0CYCsjRd4ldmONnPxMEU"],
    // Bing Webmaster Tools (same key as public/BingSiteAuth.xml).
    other: { "msvalidate.01": "E27C54431B4B61407E706E066D706D92" },
  },
  openGraph: {
    title: "Zhyronne Batican — Full Stack Developer",
    description: "Web apps, WordPress sites, landing pages, mobile tools, and AI-assisted workflows.",
    type: "website",
    siteName: "Zhyronne Batican",
    locale: "en_US",
    // No og:url here: pages without their own would all claim the home page's address.
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Zhyronne Batican portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zhyronne Batican — Full Stack Developer",
    description: "Web apps, WordPress sites, landing pages, mobile tools, and AI-assisted workflows.",
    images: ["/opengraph-image"],
  },
};

// Tells search engines who the site is about, so a name search can show the profile links.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: "Zhyronne Batican",
      url: siteUrl,
      image: `${siteUrl}/images/me.jpg`,
      jobTitle: "Full Stack Developer",
      email: "mailto:zhyronnebatican@gmail.com",
      address: { "@type": "PostalAddress", addressCountry: "PH" },
      knowsAbout: ["Web Development", "WordPress", "Landing Pages", "AI Solutions", "Mobile Apps", "UI/UX Design", "SEO"],
      sameAs: [
        "https://github.com/Enzizy",
        "https://www.linkedin.com/in/zhyronne-batican-5458a53aa/",
        "https://www.facebook.com/Hakdog.Hakplas.Haler",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Zhyronne Batican",
      inLanguage: "en",
      publisher: { "@id": `${siteUrl}/#person` },
    },
  ],
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var root=document.documentElement;var path=location.pathname;path=path.endsWith('/')?path.slice(0,-1)||'/':path;var home=path==='/'||path==='/v2'||path==='/v3';var show=false;if(home){try{show=sessionStorage.getItem('portfolio-splash-seen')!=='1';if(show)sessionStorage.setItem('portfolio-splash-seen','1')}catch(e){show=true}}root.dataset.portfolioSplash=show?'show':'skip';var movies=path==='/movies'||path.indexOf('/movies/')===0;if(movies){var curtain=false;try{curtain=sessionStorage.getItem('movies-curtain-seen')!=='1';if(curtain)sessionStorage.setItem('movies-curtain-seen','1')}catch(e){curtain=true}root.dataset.moviesCurtain=curtain?'show':'skip'}})();`,
          }}
        />
      </head>
      <body id="top" className={GeistSans.className}>
        <noscript><style>{".portfolio-splash{display:none!important}"}</style></noscript>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <PortfolioSplash />
        <CursorSkin />
        <ThemeTransition />
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
        <CatChat />
      </body>
    </html>
  );
}
