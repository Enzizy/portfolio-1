import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { CatChat } from "@/components/CatChat";
import { CursorSkin } from "@/components/CursorSkin";
import { PortfolioSplash } from "@/components/PortfolioSplash";
import { ThemeTransition } from "@/components/ThemeTransition";
import { JsonLd } from "@/components/JsonLd";
import { services, stackGroups } from "@/data/portfolio";
import { createPageMetadata, defaultDescription, defaultTitle } from "@/lib/metadata";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...createPageMetadata({ title: defaultTitle, description: defaultDescription, path: "/" }),
  authors: [{ name: "Zhyronne Batican", url: siteUrl }],
  creator: "Zhyronne Batican",
  // Lets search and AI results show full snippets and large image previews.
  robots: { googleBot: { "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  verification: {
    // Search Console property for https://zhyronne.workwithoddly.com.
    google: "zIkdOATdJZhoJ3gShLITylhFiN9kxuZNx-k04nByiM4",
    // Bing Webmaster Tools (same key as public/BingSiteAuth.xml).
    other: { "msvalidate.01": "E27C54431B4B61407E706E066D706D92" },
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
      description: defaultDescription,
      jobTitle: ["Full Stack Developer", "AI Engineer", "UI/UX Designer"],
      email: "mailto:zhyronnebatican@gmail.com",
      address: { "@type": "PostalAddress", addressCountry: "PH" },
      knowsAbout: [...services.map(({ title }) => title), ...stackGroups.flatMap(({ items }) => items)],
      makesOffer: services.map(({ title, description }) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: title, description },
      })),
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
            __html: `(function(){var root=document.documentElement;var path=location.pathname;path=path.endsWith('/')?path.slice(0,-1)||'/':path;var home=path==='/'||path==='/v2'||path==='/v3';var show=false;if(home){try{show=sessionStorage.getItem('portfolio-splash-seen')!=='1';if(show)sessionStorage.setItem('portfolio-splash-seen','1')}catch(e){show=true}}root.dataset.portfolioSplash=show?'show':'skip'})();`,
          }}
        />
      </head>
      <body id="top" className={GeistSans.className}>
        <noscript><style>{".portfolio-splash{display:none!important}"}</style></noscript>
        <JsonLd data={structuredData} />
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
