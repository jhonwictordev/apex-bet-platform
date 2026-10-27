import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Sports Data Integration - Real APIs Suite", () => {
  it("1. TheSportsDB live API responds with real data using public key 123", async () => {
    const res = await fetch("https://www.thesportsdb.com/api/v1/json/123/all_sports.php");
    assert.equal(res.status, 200, "TheSportsDB should return HTTP 200");
    const data = await res.json();
    assert.ok(Array.isArray(data.sports), "Should return sports array");
    const hasSoccer = data.sports.some((s) => s.strSport.toLowerCase() === "soccer");
    assert.ok(hasSoccer, "Should contain Soccer");

    // Check Premier League fixtures
    const eplRes = await fetch("https://www.thesportsdb.com/api/v1/json/123/eventsnextleague.php?id=4328");
    assert.equal(eplRes.status, 200, "EPL endpoint should return HTTP 200");
    const eplData = await eplRes.json();
    assert.ok(Array.isArray(eplData.events), "Should return events array for EPL");
    assert.ok(eplData.events.length > 0, "Should have at least 1 upcoming event in EPL");
    
    const sample = eplData.events[0];
    assert.ok(sample.strEvent, "Event must have a title");
    assert.ok(sample.strHomeTeam, "Event must have home team");
    assert.ok(sample.strAwayTeam, "Event must have away team");
    assert.ok(sample.dateEvent, "Event must have a valid date");
    assert.ok(sample.strHomeTeamBadge, "Event should have team badge/logo");
    console.log(`   ✔ TheSportsDB OK: Found ${sample.strEvent} on ${sample.dateEvent} (Badge: ${sample.strHomeTeamBadge?.slice(0, 45)}...)`);
  });

  it("2. OpenLigaDB live API responds without key with real match data and club crests", async () => {
    const leaguesRes = await fetch("https://api.openligadb.de/getavailableleagues");
    assert.equal(leaguesRes.status, 200, "OpenLigaDB leagues should return HTTP 200");
    const leagues = await leaguesRes.json();
    assert.ok(Array.isArray(leagues), "Should return array of leagues");
    assert.ok(leagues.length > 100, "Should contain extensive catalog of leagues");

    // Query 1. Bundesliga current matches
    const blRes = await fetch("https://api.openligadb.de/getmatchdata/bl1");
    assert.equal(blRes.status, 200, "Bundesliga endpoint should return HTTP 200");
    const matches = await blRes.json();
    assert.ok(Array.isArray(matches), "Should return array of matches");
    assert.ok(matches.length > 0, "Should have matches for current round");

    const sample = matches[0];
    assert.ok(sample.matchID, "Match must have matchID");
    assert.ok(sample.team1?.teamName, "Match must have team1 name");
    assert.ok(sample.team2?.teamName, "Match must have team2 name");
    assert.ok(sample.team1?.teamIconUrl, "Match must have team1 logo/icon");
    assert.ok(sample.matchDateTime, "Match must have matchDateTime");
    console.log(`   ✔ OpenLigaDB OK: Match ${sample.team1.teamName} vs ${sample.team2.teamName} (Status finished: ${sample.matchIsFinished}, Icon: ${sample.team1.teamIconUrl?.slice(0, 45)}...)`);
  });

  it("3. API-SPORTS key handling, rate limit budget & status validation", async () => {
    // If no key is configured, it must report instructions and official signup link
    const hasEnvKey = !!process.env.API_SPORTS_KEY;
    console.log(`   ℹ API-SPORTS Key configured in env: ${hasEnvKey ? "SIM" : "NÃO (Pronto para inserção)"}`);

    // Test rejection of dummy/invalid key against upstream API-SPORTS status endpoint
    const testRes = await fetch("https://v3.football.api-sports.io/status", {
      headers: { "x-apisports-key": "invalid_test_key_dummy_12345" },
    });
    const testJson = await testRes.json();
    // Upstream either gives 401 or json.errors
    const hasError = !testRes.ok || (testJson.errors && Object.keys(testJson.errors).length > 0) || testJson.response?.length === 0;
    assert.ok(hasError, "API-SPORTS status endpoint correctly rejects invalid key without crashing");
    console.log(`   ✔ API-SPORTS Security Validation: Invalid key correctly rejected by upstream.`);
  });

  it("4. Sports Deduplication engine merges duplicate fixtures across providers", async () => {
    class SportsDeduplicator {
      static cleanTeamName(name) {
        if (!name) return "";
        return name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\b(fc|cf|ec|cr|sc|ac|vfb|vfl|bv|sv|tsg|rb|afc|ssc|cd|ca)\b/gi, "")
          .replace(/^(1\.|2\.)\s*/, "")
          .replace(/[\s\-_]+/g, " ")
          .trim();
      }
      static areTeamsEqual(nameA, nameB) {
        const cleanA = this.cleanTeamName(nameA);
        const cleanB = this.cleanTeamName(nameB);
        if (cleanA === cleanB) return true;
        if (cleanA.length > 4 && cleanB.length > 4) {
          if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;
        }
        return false;
      }
      static isDuplicateEvent(a, b) {
        const timeDiffHours = Math.abs(new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) / 3600000;
        if (timeDiffHours > 36) return false;
        return this.areTeamsEqual(a.homeTeam, b.homeTeam) && this.areTeamsEqual(a.awayTeam, b.awayTeam);
      }
      static deduplicate(events, prioritySources = ["API_SPORTS", "OPENLIGADB", "THESPORTSDB"]) {
        const unique = [];
        for (const ev of events) {
          const idx = unique.findIndex((u) => this.isDuplicateEvent(u, ev));
          if (idx === -1) {
            unique.push(ev);
          } else {
            const existing = unique[idx];
            const existingPri = prioritySources.indexOf(existing.source);
            const newPri = prioritySources.indexOf(ev.source);
            if (newPri !== -1 && (existingPri === -1 || newPri < existingPri)) {
              unique[idx] = { ...ev, isLive: ev.isLive || existing.isLive };
            }
          }
        }
        return unique;
      }
    }

    const eventFromTSDB = {
      externalId: "tsdb_101",
      source: "THESPORTSDB",
      sportSlug: "futebol",
      sportName: "Futebol",
      competitionName: "Bundesliga",
      competitionCountry: "Alemanha",
      homeTeam: "Borussia Dortmund",
      awayTeam: "Eintracht Frankfurt",
      homeLogo: "https://example.com/dortmund-tsdb.png",
      awayLogo: "https://example.com/frankfurt-tsdb.png",
      homeScore: 0,
      awayScore: 0,
      status: "UPCOMING",
      isLive: false,
      startTime: new Date("2026-10-30T18:30:00Z"),
      lastSyncedAt: new Date(),
      markets: [],
    };

    const eventFromOpenLiga = {
      externalId: "openliga_83210",
      source: "OPENLIGADB",
      sportSlug: "futebol",
      sportName: "Futebol",
      competitionName: "Bundesliga Alemã",
      competitionCountry: "Alemanha",
      homeTeam: "1. Borussia Dortmund", // slight name variation
      awayTeam: "Eintracht Frankfurt",
      homeLogo: "https://upload.wikimedia.org/dortmund.png",
      awayLogo: "https://example.com/frankfurt.png",
      homeScore: 1,
      awayScore: 0,
      status: "LIVE",
      isLive: true,
      startTime: new Date("2026-10-30T18:30:00Z"),
      lastSyncedAt: new Date(),
      markets: [],
    };

    const isDup = SportsDeduplicator.isDuplicateEvent(eventFromTSDB, eventFromOpenLiga);
    assert.equal(isDup, true, "Should recognize variations of Borussia Dortmund vs Frankfurt as duplicate");

    const deduplicated = SportsDeduplicator.deduplicate([eventFromTSDB, eventFromOpenLiga], ["OPENLIGADB", "THESPORTSDB"]);
    assert.equal(deduplicated.length, 1, "Should merge into exactly 1 event");
    assert.equal(deduplicated[0].source, "OPENLIGADB", "Should preserve higher priority source");
    assert.equal(deduplicated[0].isLive, true, "Should retain live status");
    console.log(`   ✔ Deduplication OK: 2 records merged into 1 (Preserved source: ${deduplicated[0].source})`);
  });

  it("5. Rate Limiter Budget Manager tracks daily quota and prevents overages", async () => {
    const { SportsRateLimiterService } = await import("../src/server/modules/sports/sports-rate-limiter.service.ts");
    const limiter = SportsRateLimiterService.getInstance();

    const initialQuota = limiter.getQuota("API_SPORTS");
    assert.equal(initialQuota.dailyLimit, 100, "API-SPORTS free quota must be 100 req/day");
    assert.ok(initialQuota.remainingToday <= 100, "Remaining cannot exceed daily limit");

    // Simulate 2 requests
    limiter.recordRequest("API_SPORTS");
    limiter.recordRequest("API_SPORTS");
    const updated = limiter.getQuota("API_SPORTS");
    assert.equal(updated.requestsUsedToday, 2, "Should record 2 requests used");
    assert.equal(updated.remainingToday, 98, "Remaining should decrease to 98");
    assert.equal(limiter.canMakeRequest("API_SPORTS"), true, "Should still permit requests when budget > 3");

    console.log(`   ✔ Rate Limiter OK: 100 req/day tracked, remaining: ${updated.remainingToday}`);
  });

  it("6. SportsSyncWorker stores real external matches in Prisma with odds and crests", async () => {
    const storedEvents = await prisma.sportEvent.findMany({
      where: {
        externalSource: { in: ["THESPORTSDB", "OPENLIGADB", "API_SPORTS"] },
      },
      include: {
        competition: true,
        markets: { include: { odds: true } },
      },
      take: 5,
    });

    assert.ok(storedEvents.length > 0, "Database must contain real synced events");
    const sample = storedEvents[0];
    assert.ok(sample.externalSource, "Event must have externalSource recorded");
    assert.ok(sample.homeTeam && sample.awayTeam, "Event must have team names");
    assert.ok(sample.markets.length > 0, "Event must have generated betting markets");
    assert.ok(sample.markets[0].odds.length > 0, "Market must have betting odds");

    console.log(`   ✔ Database Persistence OK: ${storedEvents.length}+ real matches stored from ${sample.externalSource} (Competition: ${sample.competition.name}, Match: ${sample.homeTeam} vs ${sample.awayTeam})`);
  });
});
