import { ArrowUpRight, Github } from "lucide-react";
import type { CSSProperties } from "react";
import { getGitHubContributions, githubProfileUrl } from "@/lib/github";
import { MotionSection } from "./MotionSection";
import { SectionHeading } from "./SectionHeading";

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
          <a href={githubProfileUrl} target="_blank" rel="noreferrer">
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
