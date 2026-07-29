import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Zhyronne Batican — Full Stack Developer",
  description:
    "Full stack developer, AI engineer, and UI/UX designer building purposeful digital products.",
  keywords: ["Full Stack Developer", "AI Engineer", "UI/UX Designer", "Zhyronne Batican"],
  openGraph: {
    title: "Zhyronne Batican — Full Stack Developer",
    description: "Modern web applications, AI-powered tools, and thoughtful digital experiences.",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Zhyronne Batican portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zhyronne Batican — Full Stack Developer",
    description: "Modern web applications, AI-powered tools, and thoughtful digital experiences.",
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
      <body className={GeistSans.className}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
