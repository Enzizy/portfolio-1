import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { ProjectNavigation } from "@/components/ProjectNavigation";
import { createProjectMetadata } from "@/lib/metadata";

const features = [
  "Employee and user-account management",
  "Role-based Employee, HR, Admin, and CEO workspaces",
  "Configurable leave policies and eligibility rules",
  "Paid, unpaid, and partially paid leave calculation",
  "Probationary leave handling",
  "Philippine holiday and weekend-aware credit calculation",
  "Shared leave calendar for pending and approved absences",
  "Leave approvals, comments, attachments, and rejection flows",
  "Approved-leave rescheduling and cancellation requests",
  "Automatic credit refunds for approved cancellations",
  "Task and meeting management with multiple assignees",
  "Email links, in-app notifications, and preference controls",
  "Workspace-wide search and notification center",
  "Excel reports for leave, payroll impact, departments, and AWOL",
  "Administrative audit logs",
  "Responsive light and dark interfaces",
  "Automated cleanup of expired system records",
] as const;

const stack = [
  { label: "Frontend", value: "Vue 3, Composition API, Pinia, Vue Router, Vite, Tailwind CSS" },
  { label: "Backend", value: "Node.js, Express, and REST APIs" },
  { label: "Data & authentication", value: "PostgreSQL, Supabase, and JWT authorization" },
  { label: "Reporting", value: "ExcelJS-powered management exports" },
  { label: "Communication", value: "Nodemailer and in-app notifications" },
  { label: "Deployment", value: "Cloudflare Pages and Render" },
] as const;

export const metadata = createProjectMetadata({
  title: "Joyno HR — HR Operations and Leave Management Platform",
  description:
    "A full-stack HR operations platform built with Vue 3, Express, and PostgreSQL for employee records, leave workflows, approvals, reporting, and notifications.",
  image: "/images/projects/hr.png",
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
              <span>HR OPERATIONS &amp; LEAVE MANAGEMENT</span>
              <h1>Joyno HR</h1>
            </div>
            <p>
              A full-stack platform for employee records, policy-aware leave requests,
              approvals, workforce calendars, tasks, notifications, audit history,
              and Excel reporting.
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
            src="/images/projects/hr.png"
            alt="Joyno HR operations dashboard showing navigation, leave approvals, workforce availability, and recent activity"
            width={1424}
            height={762}
            sizes="(max-width: 948px) calc(100vw - 48px), 900px"
            unoptimized
            priority
          />
        </figure>

        <section className="case-study__overview" aria-labelledby="joyno-overview">
          <div>
            <span>// 01</span>
            <h2 id="joyno-overview">Overview</h2>
          </div>
          <div>
            <p className="case-study__lead">
              I worked across the frontend, API, and database layers to translate HR
              policies into reliable digital workflows.
            </p>
            <p>
              Key challenges included calculating paid and unpaid leave based on tenure
              and credits, excluding weekends and Philippine holidays, supporting
              approval conversations, and safely processing requests to move or cancel
              future approved leave.
            </p>
            <p>
              The platform also includes role-based access, transactional credit refunds,
              in-app and email notifications, scheduled retention jobs, audit logs, and
              management reporting.
            </p>
          </div>
        </section>

        <section className="case-study__features" aria-labelledby="joyno-features">
          <div className="case-study__section-heading">
            <span>// 02</span>
            <h2 id="joyno-features">Key capabilities</h2>
            <p>Designed around real HR workflows rather than isolated administrative tools.</p>
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
