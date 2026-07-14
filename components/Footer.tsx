"use client";

import { ArrowUp } from "lucide-react";

export function Footer() {
  return (
    <footer className="footer page-shell">
      <p>© {new Date().getFullYear()} Zhyronne Batican. All rights reserved.</p>
      <a href="#top">Back to top <span><ArrowUp size={16} /></span></a>
    </footer>
  );
}
