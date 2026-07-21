import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zhyronne Batican — Full Stack Developer",
  description:
    "Full stack developer, AI engineer, and UI/UX designer building purposeful digital products.",
  keywords: ["Full Stack Developer", "AI Engineer", "UI/UX Designer", "Zhyronne Batican"],
  openGraph: {
    title: "Zhyronne Batican — Full Stack Developer",
    description: "Modern web applications, AI-powered tools, and thoughtful digital experiences.",
    type: "website",
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
      <body className={GeistSans.className}>{children}</body>
    </html>
  );
}
