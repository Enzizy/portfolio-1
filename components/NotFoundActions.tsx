"use client";

import { ArrowLeft, Command } from "lucide-react";
import Link from "next/link";

export function NotFoundActions() {
  return (
    <div className="not-found__actions">
      <Link className="button button--dark" href="/">
        <ArrowLeft size={15} /> Back home
      </Link>
      <Link className="button button--light" href="/projects">
        View projects
      </Link>
      <button
        className="button button--light"
        type="button"
        onClick={() => window.dispatchEvent(new Event("portfolio:open-commands"))}
      >
        <Command size={15} /> Open commands
      </button>
    </div>
  );
}
