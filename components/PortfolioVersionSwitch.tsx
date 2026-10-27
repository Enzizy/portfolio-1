import Link from "next/link";

const versions = [
  { version: 1, label: "V1", href: "/" },
  { version: 2, label: "V2", href: "/v2" },
  { version: 3, label: "V3", href: "/v3" },
  { version: 4, label: "V4", href: "/v4" },
] as const;

export function PortfolioVersionSwitch({ version }: { version: 1 | 2 | 3 | 4 }) {
  return (
    <nav className="portfolio-version-switch" aria-label="Portfolio layout">
      {versions.map((item) => (
        <Link key={item.version} href={item.href} aria-current={version === item.version ? "page" : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
