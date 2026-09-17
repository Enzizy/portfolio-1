import Link from "next/link";

export function PortfolioVersionSwitch({ version }: { version: 1 | 2 }) {
  return (
    <nav className="portfolio-version-switch" aria-label="Portfolio layout">
      <Link href="/" aria-current={version === 1 ? "page" : undefined}>V1</Link>
      <Link href="/v2" aria-current={version === 2 ? "page" : undefined}>V2</Link>
    </nav>
  );
}
