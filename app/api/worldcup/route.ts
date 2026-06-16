import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const STANDINGS_URL = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type JsonObject = Record<string, unknown>;
type MatchTeam = {
  side: string;
  name: string;
  short: string;
  score: string;
  winner: boolean;
  logo: string;
};
type MatchStat = {
  label: string;
  home?: string;
  away?: string;
};
type Match = {
  id: string;
  name: string;
  shortName: string;
  kickoff: string;
  kickoffLocal: string;
  phase: string;
  venue: string;
  state: string;
  status: string;
  clock: string;
  period: number;
  teams: MatchTeam[];
  stats?: MatchStat[];
  stream?: {
    provider: string;
    title: string;
    pageUrl: string;
    hlsUrl: string;
  } | null;
};

async function getJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "teslakortingscode-worldcup/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Upstream request failed: ${response.status} ${url}`);
  }

  return (await response.json()) as JsonObject;
}

async function getText(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "teslakortingscode-worldcup/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Upstream HTML request failed: ${response.status} ${url}`);
  }

  return await response.text();
}

function asArray<T = JsonObject>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function teamLogo(team: JsonObject) {
  const logos = asArray<JsonObject>(team.logos);
  return (
    (logos.find((logo) => asArray<string>(logo.rel).includes("default"))?.href as string | undefined) ||
    (team.logo as string | undefined) ||
    ""
  );
}

function parseMatch(event: JsonObject): Match {
  const competition = asArray<JsonObject>(event.competitions)[0] || {};
  const competitors = asArray<JsonObject>(competition.competitors);
  const status = (competition.status as JsonObject) || (event.status as JsonObject) || {};
  const statusType = (status.type as JsonObject) || {};
  const venue = (competition.venue as JsonObject) || (event.venue as JsonObject) || {};
  const note = asArray<JsonObject>(competition.notes)[0] || asArray<JsonObject>(competition.details)[0] || {};

  const teams = competitors.map((competitor) => {
    const team = (competitor.team as JsonObject) || {};
    return {
      side: (competitor.homeAway as string | undefined) || "",
      name: (team.displayName as string | undefined) || "Unknown",
      short: (team.shortDisplayName as string | undefined) || (team.abbreviation as string | undefined) || "UNK",
      score: (competitor.score as string | undefined) || "0",
      winner: Boolean(competitor.winner),
      logo: teamLogo(team),
    };
  });

  return {
    id: String(event.id || ""),
    name: (event.name as string | undefined) || "",
    shortName: (event.shortName as string | undefined) || "",
    kickoff: (event.date as string | undefined) || "",
    kickoffLocal: event.date
      ? new Date(String(event.date)).toISOString()
      : "",
    phase:
      (note.headline as string | undefined) ||
      (note.detail as string | undefined) ||
      ((competition.format as JsonObject)?.displayName as string | undefined) ||
      "World Cup",
    venue: (venue.fullName as string | undefined) || (venue.address as string | undefined) || "",
    state: (statusType.state as string | undefined) || "",
    status:
      (statusType.shortDetail as string | undefined) ||
      (statusType.detail as string | undefined) ||
      "Scheduled",
    clock: (status.displayClock as string | undefined) || "",
    period: Number(status.period || 0),
    teams,
  };
}

function parseStats(summary: JsonObject) {
  const tables = asArray<JsonObject>((summary.boxscore as JsonObject)?.teams);
  if (!tables.length) return [];

  const byLabel = new Map<string, { label: string; home?: string; away?: string }>();
  tables.forEach((table, index) => {
    const isHome = index === 0;
    const stats = asArray<JsonObject>(table.statistics);
    for (const stat of stats) {
      const label = String(stat.name || stat.displayName || "");
      const value = String(stat.displayValue || stat.value || "");
      if (!label || !value) continue;
      const entry = byLabel.get(label) || { label };
      if (isHome) entry.home = value;
      else if (entry.away == null) entry.away = value;
      else entry.home ??= value;
      byLabel.set(label, entry);
    }
  });

  return [...byLabel.values()]
    .filter((stat) => stat.home != null || stat.away != null)
    .slice(0, 8);
}

function parseGroups(standings: JsonObject) {
  return asArray<JsonObject>(standings.children).map((group) => {
    const entries = asArray<JsonObject>((group.standings as JsonObject)?.entries)
      .map((entry) => {
        const stats = asArray<JsonObject>(entry.stats);
        const stat = (name: string) =>
          stats.find((item) => String(item.name || "").toLowerCase() === name.toLowerCase());
        return {
          team: ((entry.team as JsonObject)?.displayName as string | undefined) || "Unknown",
          points: String(stat("points")?.displayValue ?? stat("points")?.value ?? "-"),
          played: String(stat("gamesPlayed")?.displayValue ?? stat("gamesPlayed")?.value ?? "-"),
          gd: String(stat("pointDifferential")?.displayValue ?? stat("pointDifferential")?.value ?? "-"),
          rank: Number(stat("rank")?.value ?? 999),
        };
      })
      .sort((a, b) => a.rank - b.rank)
      .map(({ rank: _rank, ...team }) => team);

    return {
      name: (group.name as string | undefined) || "Group",
      entries,
    };
  });
}

function decodeNosUrl(value: string) {
  return value
    .replace(/\\u0026/g, "&")
    .replace(/&amp;/g, "&");
}

async function findNosLiveStream() {
  const liveHtml = await getText("https://nos.nl/live");
  const slugs = [...liveHtml.matchAll(/\/livestream\/[a-z0-9-]+/gi)]
    .map((match) => match[0])
    .filter((slug, index, all) => all.indexOf(slug) === index);

  const currentSlug =
    slugs.find((slug) => slug.includes("kijk-hier-live-mee")) ||
    slugs.find((slug) => slug.includes("wk-voetbal")) ||
    slugs[0];

  if (!currentSlug) return null;

  const pageUrl = `https://nos.nl${currentSlug}`;
  const pageHtml = await getText(pageUrl);
  const titleMatch = pageHtml.match(/<title>([^<]+)<\/title>/i);
  const hlsMatch = pageHtml.match(/https:\/\/resolver\.streaming\.api\.nos\.nl\/stream\?stream=[^"'\\]+?profile=hls_unencrypted[^"'\\]+/i);

  if (!hlsMatch) {
    return {
      provider: "NOS",
      title: titleMatch?.[1]?.replace(/\s*\|\s*NOS.*$/i, "").trim() || "NOS Live",
      pageUrl,
      hlsUrl: "",
    };
  }

  return {
    provider: "NOS",
    title: titleMatch?.[1]?.replace(/\s*\|\s*NOS.*$/i, "").trim() || "NOS Live",
    pageUrl,
    hlsUrl: decodeNosUrl(hlsMatch[0]),
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    const [scoreboard, standings] = await Promise.all([
      getJson(SCOREBOARD_URL),
      getJson(STANDINGS_URL),
    ]);

    const matches = asArray<JsonObject>(scoreboard.events).map(parseMatch);
    const featured =
      matches.find((match) => match.state === "in") ||
      matches.find((match) => match.state === "pre") ||
      matches.find((match) => match.state === "post") ||
      null;

    let featuredWithStats: Match | null = featured;
    if (featured?.id) {
      try {
        const summary = await getJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${featured.id}`);
        featuredWithStats = {
          ...featured,
          stats: parseStats(summary),
        };
      } catch {
        featuredWithStats = featured;
      }
    }

    if (featuredWithStats?.state === "in") {
      try {
        const nosStream = await findNosLiveStream();
        if (nosStream) {
          featuredWithStats = {
            ...featuredWithStats,
            stream: nosStream,
          };
        }
      } catch {
        featuredWithStats = {
          ...featuredWithStats,
          stream: null,
        };
      }
    }

    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        tournament: "2026 FIFA World Cup",
        featured: featuredWithStats,
        matches: matches.slice(0, 8),
        groups: parseGroups(standings).slice(0, 12),
      },
      {
        headers: CORS_HEADERS,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: String((error as Error)?.message || error || "World Cup feed failed"),
      },
      {
        status: 502,
        headers: CORS_HEADERS,
      },
    );
  }
}
