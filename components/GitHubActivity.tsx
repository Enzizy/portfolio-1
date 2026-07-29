import { ArrowUpRight, Github } from "lucide-react";
import type { CSSProperties } from "react";
import { MotionSection } from "./MotionSection";
import { SectionHeading } from "./SectionHeading";

const profileUrl = "https://github.com/Enzizy";
const contributionsUrl = "https://github.com/users/Enzizy/contributions";

type ContributionDay = {
  date: string;
  level: number;
  week: number;
  weekday: number;
};

type MonthLabel = {
  label: string;
  week: number;
};

type GitHubContributionData = {
  contributionCount: number | null;
  days: ContributionDay[];
  months: MonthLabel[];
  weekCount: number;
};

async function getGitHubContributions(): Promise<GitHubContributionData> {
  try {
    const response = await fetch(contributionsUrl, {
      headers: { "User-Agent": "Zhyronne-Portfolio" },
      next: { revalidate: 21600 },
    });

    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

    const html = await response.text();
    const contributionMatch = html.match(
      /id="js-contribution-activity-description"[\s\S]*?([\d,]+)\s+contributions?/i,
    );
    const contributionCount = contributionMatch
      ? Number(contributionMatch[1].replaceAll(",", ""))
      : null;

    const cells = html.match(/<td\b[^>]*data-date="[^"]+"[^>]*>/g) ?? [];
    const parsed = cells.flatMap((cell) => {
      const date = cell.match(/data-date="([^"]+)"/)?.[1];
      const level = cell.match(/data-level="([0-4])"/)?.[1];
      return date && level ? [{ date, level: Number(level) }] : [];
    });

    if (!parsed.length) throw new Error("GitHub returned no contribution days");

    parsed.sort((left, right) => left.date.localeCompare(right.date));
    const firstDate = new Date(`${parsed[0].date}T00:00:00Z`);
    const days = parsed.map(({ date, level }) => {
      const currentDate = new Date(`${date}T00:00:00Z`);
      const elapsedDays = Math.round((currentDate.getTime() - firstDate.getTime()) / 86400000);
      return {
        date,
        level,
        week: Math.floor(elapsedDays / 7) + 1,
        weekday: currentDate.getUTCDay() + 1,
      };
    });

    const monthFormatter = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
    const seenMonths = new Set<string>();
    const months = days.flatMap((day) => {
      const date = new Date(`${day.date}T00:00:00Z`);
      const monthKey = day.date.slice(0, 7);
      if (date.getUTCDate() > 7 || seenMonths.has(monthKey)) return [];
      seenMonths.add(monthKey);
      return [{ label: monthFormatter.format(date), week: day.week }];
    });

    return {
      contributionCount,
      days,
      months,
      weekCount: Math.max(...days.map((day) => day.week)),
    };
  } catch {
    return { contributionCount: null, days: [], months: [], weekCount: 53 };
  }
}

export async function GitHubActivity() {
  const data = await getGitHubContributions();
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${data.weekCount}, 9px)`,
  };

  return (
    <MotionSection id="activity" labelledBy="activity-title" className="section github-section">
      <SectionHeading number="04" title="GitHub Activity" id="activity-title" />
      <div className="github-panel">
        <div className="github-panel__header">
          <div>
            <span>PUBLIC DEVELOPMENT ACTIVITY</span>
            <h3>
              {data.contributionCount === null
                ? "Contribution activity"
                : `${data.contributionCount.toLocaleString()} contributions in the last year`}
            </h3>
          </div>
          <a href={profileUrl} target="_blank" rel="noreferrer">
            <Github size={15} /> View GitHub <ArrowUpRight size={13} />
          </a>
        </div>

        {data.days.length ? (
          <div className="github-calendar-scroll">
            <div className="github-calendar" aria-label="GitHub contribution activity for Enzizy">
              <div className="github-months" style={gridStyle} aria-hidden="true">
                {data.months.map((month) => (
                  <span key={`${month.label}-${month.week}`} style={{ gridColumn: month.week }}>
                    {month.label}
                  </span>
                ))}
              </div>
              <div className="github-calendar__body">
                <div className="github-weekdays" aria-hidden="true">
                  <span style={{ gridRow: 2 }}>Mon</span>
                  <span style={{ gridRow: 4 }}>Wed</span>
                  <span style={{ gridRow: 6 }}>Fri</span>
                </div>
                <div className="github-days" style={gridStyle} aria-hidden="true">
                  {data.days.map((day) => (
                    <span
                      className={`github-day github-day--${day.level}`}
                      key={day.date}
                      style={{ gridColumn: day.week, gridRow: day.weekday }}
                      title={day.date}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="github-panel__fallback">
            GitHub activity is temporarily unavailable. Visit the profile to see the latest contributions.
          </p>
        )}

        <div className="github-panel__footer">
          <p>Public activity only. Client and private repository work may not appear here.</p>
          <div className="github-legend" aria-label="Contribution intensity from less to more">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <i className={`github-day github-day--${level}`} key={level} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
