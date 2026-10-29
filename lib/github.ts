export const githubProfileUrl = "https://github.com/Enzizy";
const contributionsUrl = "https://github.com/users/Enzizy/contributions";

export type ContributionDay = {
  date: string;
  level: number;
  week: number;
  weekday: number;
};

export type MonthLabel = {
  label: string;
  week: number;
};

export type GitHubContributionData = {
  contributionCount: number | null;
  days: ContributionDay[];
  months: MonthLabel[];
  weekCount: number;
};

/** Scrapes the public contribution calendar. Returns an empty year rather than throwing. */
export async function getGitHubContributions(): Promise<GitHubContributionData> {
  try {
    const response = await fetch(contributionsUrl, {
      headers: { "User-Agent": "Zhyronne-Portfolio" },
      // Fetched once per build; a scheduled daily rebuild keeps the stats current.
      cache: "force-cache",
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
