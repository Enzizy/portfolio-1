import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, ExternalLink } from "lucide-react";
import { Footer } from "@/components/Footer";
import { CaseStudyStory } from "@/components/CaseStudyStory";
import { Navigation } from "@/components/Navigation";
import { ProjectNavigation } from "@/components/ProjectNavigation";
import { createProjectMetadata } from "@/lib/metadata";

const features = [
  "Dashboard with revenue and expenses, net income, balance health, tax calendar and recent activity",
  "Journal entries and chart of accounts, where only posted lines affect balances",
  "General ledger, trial balance, income statement and balance sheet with period filters",
  "CSV export and print layouts with company headers and signatories",
  "Analytics for assets, liabilities, equity, revenue and expenses, with monthly trends",
  "Sales and purchase documents, payment allocations and transactional numbering",
  "Summary of Sales and BIR books from posted records, for review and export",
  "Banking, asset management, and tax and payroll record tracking",
  "Company settings: profile, owners, registration, tax rules, items, series and report templates",
  "Users and roles enforced on the server, with protected last administrator and session revocation",
  "Audit trail where every change and its audit entry commit together",
  "Private file storage and nightly encrypted backups to the owner's PC",
] as const;

const stack = [
  { label: "Frontend", value: "Vue 3, TypeScript, Vite and Tailwind CSS, with a shared shell, sidebar and searchable navigation" },
  { label: "Backend", value: "Node.js and Express 5 with Zod validation and an OpenAPI description" },
  { label: "Data", value: "Company-scoped PostgreSQL records with version checks; money stored as integer centavos" },
  { label: "Reporting", value: "Ledger contract feeding statements and analytics; ExcelJS and CSV exports" },
  { label: "Quality", value: "Vitest, Vue Test Utils and PGlite-backed tests, strict ESLint and vue-tsc type checks" },
  { label: "Deployment", value: "Self-hosted on an Ubuntu VPS behind joynoadmin.tech, with nightly encrypted backups" },
] as const;

export const metadata = createProjectMetadata({
  path: "/projects/joyno-accounting",
  title: "Joyno Accounting — Accounting System",
  description:
    "A collaborative accounting system co-built with Vue 3, Express, and PostgreSQL: journals, financial statements, sales and purchases, banking, assets, tax record tracking, roles, and audit trails.",
  image: "/images/projects/joyno-accounting.png",
  imageAlt: "Joyno Accounting dashboard",
});

export default function JoynoAccountingPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="page-shell case-study" tabIndex={-1}>
        <header className="case-study__header">
          <Link className="case-study__back" href="/projects">
            <ArrowLeft size={14} /> All projects
          </Link>
          <p className="eyebrow">// CASE STUDY 10</p>
          <div className="case-study__title">
            <div>
              <span>ACCOUNTING &amp; FINANCIAL REPORTING</span>
              <h1>Joyno Accounting</h1>
            </div>
            <p>
              A company accounting system covering journals, financial statements,
              sales and purchases, banking, assets, and tax record tracking, with
              server-enforced roles and a complete audit trail.
            </p>
          </div>
          <dl className="case-study__facts">
            <div><dt>Role</dt><dd>Co-developer · full-stack development</dd></div>
            <div><dt>Platform</dt><dd>Responsive web application</dd></div>
            <div><dt>Core stack</dt><dd>Vue 3 · Express · PostgreSQL</dd></div>
          </dl>
        </header>

        <figure className="case-study__hero">
          <Image
            src="/images/projects/joyno-accounting.png"
            alt="Joyno Accounting dashboard showing revenue, expenses and net income, a monthly revenue chart, the tax calendar, balance health, operating result and recent activity"
            width={1423}
            height={764}
            sizes="(max-width: 948px) calc(100vw - 48px), 900px"
            priority
          />
        </figure>

        <CaseStudyStory id="joyno-accounting-story" story={{
          challenge: "The company needed its books, documents and reports in one place, with numbers it could trust and a clear record of who changed what.",
          decisions: "We built it together around one shared ledger contract, so every module feeds the same books. Reports read only posted journal lines, money is stored as integer centavos, and assumptions the accountants have not confirmed are isolated and flagged rather than invented.",
          result: "Joyno Accounting runs on the company's own server with real records: journals, statements, analytics, sales, purchases, banking, assets and company settings, protected by server-side permissions and nightly encrypted backups.",
        }} />

        <section className="case-study__features" aria-labelledby="joyno-accounting-features">
          <div className="case-study__section-heading">
            <span>// 02</span>
            <h2 id="joyno-accounting-features">Key capabilities</h2>
            <p>From a posted journal line to a signed financial statement.</p>
          </div>
          <ul>
            {features.map((feature) => (
              <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>
            ))}
          </ul>
        </section>

        <section className="case-study__technology" aria-labelledby="joyno-accounting-technology">
          <div className="case-study__section-heading">
            <span>// 03</span>
            <h2 id="joyno-accounting-technology">Technology</h2>
            <p>A typed Vue frontend and a validated Express API over company-scoped PostgreSQL.</p>
          </div>
          <dl>
            {stack.map(({ label, value }) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>

        <section className="case-study__cta" aria-labelledby="joyno-accounting-cta">
          <div>
            <span>// SOURCE &amp; CONTACT</span>
            <h2 id="joyno-accounting-cta">Need business software your accountants can trust?</h2>
          </div>
          <div className="case-study__actions">
            <a className="button button--light" href="https://github.com/sauxxxxx/joynoacctg" target="_blank" rel="noreferrer">
              View repository <ExternalLink size={15} />
            </a>
            <Link className="button button--dark" href="/#contact">
              Let&apos;s work together <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
        <ProjectNavigation currentHref="/projects/joyno-accounting" />
      </main>
      <Footer />
    </>
  );
}
