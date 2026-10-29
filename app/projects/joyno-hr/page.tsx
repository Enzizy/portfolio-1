import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { Footer } from "@/components/Footer";
import { CaseStudyStory } from "@/components/CaseStudyStory";
import { Navigation } from "@/components/Navigation";
import { ProjectNavigation } from "@/components/ProjectNavigation";
import { createProjectMetadata } from "@/lib/metadata";

const features = [
  "Pay runs per payday and shift: employees, attendance, review pay, approve and pay, payslips",
  "Separate Day and Night shift payroll, with automatic night differential",
  "Biometric attendance CSV import with a read-only preview and audited HR review",
  "First and last scan of the day from any reader, with late and undertime in minutes",
  "Approved overtime and special-holiday / rest-day pay calculated from attendance",
  "One adjust-pay panel for loans, cash advances, allowances and basic-pay corrections",
  "SSS, PhilHealth, Pag-IBIG and withholding tax from an editable BIR table",
  "Payslip PDFs in the company's workbook format, with print, save and email",
  "Practice payroll on selected employees, clearly labelled and kept out of real pay",
  "13th-month, SIL cash conversion, remittance, payroll and attendance reports",
  "One profile per employee for records, compensation history, schedules and government IDs",
  "Configurable leave policies, Philippine holiday-aware credits and a shared leave calendar",
  "Leave approvals, rescheduling, cancellations with credit refunds, and calendar date changes",
  "Announcements targeted by shift, department or person, with read receipts",
  "Tasks and meetings, notifications, workspace search and email preferences",
  "Role-based Employee, HR, Admin and CEO workspaces with full audit history",
] as const;

const stack = [
  { label: "Frontend", value: "Vue 3, Composition API, Pinia, Vue Router, Vite and Tailwind CSS" },
  { label: "Backend", value: "Node.js, Express and REST APIs, with payroll rules versioned per run" },
  { label: "Data & authentication", value: "PostgreSQL with row-level security, migrations and JWT authorization" },
  { label: "Payroll documents", value: "Workbook-format payslip PDFs, payroll registers and contribution exports" },
  { label: "Communication", value: "Payslip and announcement email, plus in-app notifications" },
  { label: "Quality", value: "150+ backend tests, isolated database integration tests and Playwright checks" },
] as const;

export const metadata = createProjectMetadata({
  path: "/projects/joyno-hr",
  title: "Joyno HR — HR, Attendance and Payroll Platform",
  description:
    "A full-stack HR and payroll platform built with Vue 3, Express, and PostgreSQL: attendance review, Day and Night pay runs, payslips, government contributions, leave workflows, reports, and announcements.",
  image: "/images/projects/hr.webp",
  imageAlt: "Joyno HR operations dashboard",
});

export default function JoynoHrPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="page-shell case-study" tabIndex={-1}>
        <header className="case-study__header">
          <Link className="case-study__back" href="/projects">
            <ArrowLeft size={14} /> All projects
          </Link>
          <p className="eyebrow">// CASE STUDY 01</p>
          <div className="case-study__title">
            <div>
              <span>HR, ATTENDANCE &amp; PAYROLL</span>
              <h1>Joyno HR</h1>
            </div>
            <p>
              A full-stack platform that runs payroll end to end, from biometric attendance
              to approved pay runs and payslips, alongside employee records, leave,
              announcements, reports and audit history.
            </p>
          </div>
          <dl className="case-study__facts">
            <div><dt>Role</dt><dd>Full-stack development</dd></div>
            <div><dt>Platform</dt><dd>Responsive web application</dd></div>
            <div><dt>Core stack</dt><dd>Vue 3 · Express · PostgreSQL</dd></div>
          </dl>
        </header>

        <figure className="case-study__hero">
          <Image
            src="/images/projects/hr.webp"
            alt="Joyno HR operations dashboard showing navigation, leave approvals, workforce availability, and recent activity"
            width={1424}
            height={762}
            sizes="(max-width: 948px) calc(100vw - 48px), 900px"
            unoptimized
            priority
          />
        </figure>

        <CaseStudyStory id="joyno-story" story={{
          challenge: "Payroll depends on attendance, leave, schedules and government rules, and a single mistake reaches every employee. HR was working from a spreadsheet workbook and needed a system that could follow it exactly while making every decision traceable.",
          decisions: "I modelled payroll as a pay run per payday and shift: import attendance, review only the days that need a decision, calculate, approve, mark paid, then release payslips. Formulas were reconciled line by line against the company workbook, and a labelled practice mode lets HR rehearse on real data without touching real pay.",
          result: "Joyno HR now covers the full employee cycle in one place: records, attendance, leave, Day and Night payroll, workbook-format payslips, government contributions, 13th-month and SIL reports, and announcements, backed by more than 150 automated tests.",
        }} />

        <section className="case-study__features" aria-labelledby="joyno-features">
          <div className="case-study__section-heading">
            <span>// 02</span>
            <h2 id="joyno-features">Key capabilities</h2>
            <p>Built around the real HR and payroll cycle, not isolated admin screens.</p>
          </div>
          <ul>
            {features.map((feature) => (
              <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>
            ))}
          </ul>
        </section>

        <section className="case-study__technology" aria-labelledby="joyno-technology">
          <div className="case-study__section-heading">
            <span>// 03</span>
            <h2 id="joyno-technology">Technology</h2>
            <p>Built across the frontend, API, database, reporting, and communication layers.</p>
          </div>
          <dl>
            {stack.map(({ label, value }) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>

        <section className="case-study__cta" aria-labelledby="joyno-cta">
          <div>
            <span>// NEXT PROJECT?</span>
            <h2 id="joyno-cta">Have a system you want to bring to life?</h2>
          </div>
          <Link className="button button--dark" href="/#contact">
            Let&apos;s work together <ArrowUpRight size={15} />
          </Link>
        </section>
        <ProjectNavigation currentHref="/projects/joyno-hr" />
      </main>
      <Footer />
    </>
  );
}
