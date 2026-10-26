import { NormalizedSportEvent } from "./types";

export class SportsDeduplicator {
  /**
   * Normalizes a team name for fuzzy matching across providers
   */
  static cleanTeamName(name: string): string {
    if (!name) return "";

    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents
      .replace(/\b(fc|cf|ec|cr|sc|ac|vfb|vfl|bv|sv|tsg|rb|afc|ssc|cd|ca)\b/gi, "")
      .replace(/^(1\.|2\.)\s*/, "") // remove leading "1. " or "2. "
      .replace(/[\s\-_]+/g, " ")
      .trim();
  }

  /**
   * Determines if two team names are likely referring to the same team
   */
  static areTeamsEqual(nameA: string, nameB: string): boolean {
    const cleanA = this.cleanTeamName(nameA);
    const cleanB = this.cleanTeamName(nameB);

    if (cleanA === cleanB) return true;
    if (cleanA.length > 4 && cleanB.length > 4) {
      if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;
    }
    return false;
  }

  /**
   * Determines if two events represent the same fixture
   */
  static isDuplicateEvent(a: NormalizedSportEvent, b: NormalizedSportEvent): boolean {
    // Check same sport
    if (a.sportSlug !== b.sportSlug) return false;

    // Check same teams (home vs home, away vs away)
    const homeMatches = this.areTeamsEqual(a.homeTeam, b.homeTeam);
    const awayMatches = this.areTeamsEqual(a.awayTeam, b.awayTeam);

    if (!homeMatches || !awayMatches) return false;

    // Check time proximity (within 12 hours)
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    const hoursDiff = Math.abs(timeA - timeB) / (1000 * 60 * 60);

    return hoursDiff < 12;
  }

  /**
   * Merges list of events, preserving the highest priority source
   */
  static deduplicate(
    events: NormalizedSportEvent[],
    priorityOrder: string[] = ["API_SPORTS", "OPENLIGADB", "THESPORTSDB"]
  ): NormalizedSportEvent[] {
    const uniqueList: NormalizedSportEvent[] = [];

    // Sort events by source priority first
    const sorted = [...events].sort((a, b) => {
      const idxA = priorityOrder.indexOf(a.source);
      const idxB = priorityOrder.indexOf(b.source);
      const prioA = idxA === -1 ? 99 : idxA;
      const prioB = idxB === -1 ? 99 : idxB;
      return prioA - prioB;
    });

    for (const item of sorted) {
      const existingIdx = uniqueList.findIndex((u) => this.isDuplicateEvent(u, item));
      if (existingIdx === -1) {
        uniqueList.push(item);
      } else {
        // Merge attributes: if existing lacks logo or details, grab from duplicate
        const existing = uniqueList[existingIdx];
        if (!existing.homeLogo && item.homeLogo) existing.homeLogo = item.homeLogo;
        if (!existing.awayLogo && item.awayLogo) existing.awayLogo = item.awayLogo;
        if (!existing.venue && item.venue) existing.venue = item.venue;
        if (item.isLive && !existing.isLive) {
          existing.isLive = true;
          existing.status = "LIVE";
          existing.homeScore = item.homeScore;
          existing.awayScore = item.awayScore;
        }
      }
    }

    return uniqueList;
  }
}
