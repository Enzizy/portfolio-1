"use client";

import { useEffect, useState } from "react";

const format = () =>
  new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());

/** Local time in Manila, so visitors can see when a reply is likely. */
export function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(format());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 15_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <span className="v4-clock" aria-label={time ? `Manila time ${time}` : undefined}>
      <i aria-hidden="true" />
      Manila {time ?? "--:--"}
    </span>
  );
}
