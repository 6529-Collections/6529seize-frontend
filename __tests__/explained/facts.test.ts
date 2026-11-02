import { createHash } from "node:crypto";
import {
  createFactBook,
  factFromSnapshot,
  factsAsJson,
  fmt,
  isKnownFactId,
  UnknownFactError,
  type Fact,
  type FactId,
} from "@/lib/explained/facts";
import { RECORD } from "@/lib/explained/factInputs";
import { fixtureFactInputs, FIXTURE_NOW } from "@/lib/explained/fixtureInputs";
import {
  FIXTURE_DAY_TEXTS,
  FIXTURE_INDEX_TEXT,
} from "@/lib/explained/fixtures/feedFixture";
import { FACT_REGISTRY } from "@/lib/explained/registry";
import { nextDecisionAfter } from "@/lib/explained/registry/siteFacts";

/**
 * The facts layer against the final mockups' values (renders/values.json of
 * 2026-10-18 09:40 UTC): every value the mockups printed from the feed, the
 * manifest, the editions and the engine comes out of the registry the same,
 * from the same sources.
 */
const book = createFactBook(fixtureFactInputs());
const show = (id: FactId, style: "short" | "long" = "short") =>
  fmt(book.get(id), "en-US", style);

describe("the facts layer", () => {
  it("fixture day files match the index's SHA-256, byte for byte", () => {
    const index = JSON.parse(FIXTURE_INDEX_TEXT) as {
      days: { cycleDay: number; sha256: string }[];
    };
    for (const day of index.days) {
      const text = FIXTURE_DAY_TEXTS[day.cycleDay];
      expect(text).toBeDefined();
      expect(
        createHash("sha256")
          .update(text ?? "", "utf8")
          .digest("hex")
      ).toBe(day.sha256);
    }
  });

  it("prints the feed's numbers as the mockups did", () => {
    expect(show("feed.writtenAt")).toBe("00:49 UTC");
    expect(show("feed.writtenAt", "long")).toBe("2026-10-18 00:49:01 UTC");
    expect(show("page.readAt")).toBe("09:40 UTC");
    expect(show("tdh.latest.cycle")).toBe("20,744");
    expect(show("tdh.latest.date")).toBe("Oct 18");
    expect(show("tdh.latest.date", "long")).toBe("October 18, 2026");
    expect(show("tdh.latest.total")).toBe("2,082,190,981");
    expect(show("tdh.latest.total.python")).toBe("2,082,190,981");
    expect(show("tdh.latest.total.live")).toBe("2,082,190,981");
    expect(show("tdh.latest.delta")).toBe("+2,951,745");
    expect(show("tdh.latest.identities")).toBe("10,273");
    expect(show("tdh.latest.wallets")).toBe("11,126");
    expect(show("tdh.latest.agree.live.identities.equal")).toBe("10,273");
    expect(show("tdh.latest.agree.live.wallets.total")).toBe("11,126");
    expect(show("tdh.latest.cutoff")).toBe("26,215,721");
    expect(show("tdh.latest.mode")).toBe("unchecked-history");
    expect(show("tdh.latest.ruleVersion")).toBe("tdh-v1.0");
    expect(show("tdh.latest.ruleId")).toBe("0x63e242fa…163bcf22");
    expect(show("tdh.latest.registry")).toBe("0x74b4a8f9…84c663d3");
    expect(show("tdh.latest.roots.cycle")).toBe("0x43717ba9…79d299ec");
    expect(show("tdh.latest.inputSha")).toBe("40609edb…bdcb70b1");
    expect(show("tdh.latest.recordsSha")).toBe("4a9bd5d7…dd04027b");
    expect(show("tdh.latest.liveSha")).toBe("8b670430…7c2992a2");
    expect(show("tdh.latest.file.sha256")).toBe("1c01ed1d…e05b3a0a");
    expect(book.get("tdh.latest.file.sha256Read").value).toBe(
      book.get("tdh.latest.file.sha256").value
    );
    expect(show("tdh.latest.builds.rust.commit")).toBe("0d25aa6");
    expect(show("tdh.latest.builds.rust.runtime")).toBe("8 min 22 s");
    expect(show("tdh.latest.builds.python.commit")).toBe("f840096");
    expect(show("tdh.latest.builds.python.runtime")).toBe("11.7 s");
    expect(show("tdh.days.compared")).toBe("5");
    expect(show("tdh.days.equal")).toBe("5");
    expect(show("tdh.days.first")).toBe("Oct 14");
    expect(show("tdh.open.cycle")).toBe("20,745");
    expect(book.get("tdh.open.minutesLeft").value).toBe(14 * 60 + 20);
    expect(book.get("tdh.open.progress").value).toBe(40.3);
    expect(show("tdh.nextResultAt")).toBe("Oct 19, 00:50 UTC");
    expect(show("tdh.cutover.about")).toBe("Oct 23");
  });

  it("marks the three days rewritten on Oct 16 and the two written on time", () => {
    const days =
      book.get<{ cycle: number; rewritten: boolean }[]>("tdh.days").value;
    expect(days.map((day) => [day.cycle, day.rewritten])).toEqual([
      [20740, true],
      [20741, true],
      [20742, true],
      [20743, false],
      [20744, false],
    ]);
  });

  it("names the newer decisions on the values a day file reports by the old rule", () => {
    expect(book.get("tdh.latest.ruleVersion").drift).toEqual({
      by: "D137",
      says: "rules.version",
    });
    expect(book.get("tdh.latest.ruleId").drift).toEqual({
      by: "D137",
      says: "rules.ruleId",
    });
    expect(book.get("tdh.latest.registry").drift).toEqual({
      by: "D136",
      says: "rules.registry",
    });
    for (const id of Object.keys(FACT_REGISTRY)) {
      const says = book.maybe(id as FactId)?.drift?.says;
      if (says !== undefined) {
        expect(isKnownFactId(says)).toBe(true);
      }
    }
  });

  it("reads the rules from P26 at a731bca and the record's head", () => {
    expect(show("rules.version")).toBe("tdh-v1.4");
    expect(show("rules.registry")).toBe("0x3cfa0e6e…c09d9f36");
    expect(show("rules.ruleId")).toBe("0x772d61ed…7418ab3f");
    expect(show("rules.vectors")).toBe("108");
    expect(show("rules.p26Commit")).toBe("a731bca");
    expect(show("rules.leanCommit")).toBe("e252d5f");
    // The head moves with every decision: read it from the synced snapshot.
    expect(show("rules.chainHead")).toBe(RECORD.head.commit.slice(0, 7));
    expect(show("rules.newestDecision")).toBe(RECORD.head.newestDecision);
    expect(Number(RECORD.head.newestDecision.slice(1))).toBeGreaterThanOrEqual(
      141
    );
    expect(show("rules.maxWallets")).toBe("4");
    expect(show("rules.ungatedMaxWallets")).toBe("3");
    expect(show("rules.gateActivation", "long")).toBe(
      "2026-10-15 00:00:00 UTC"
    );
    expect(show("rules.editionThreshold")).toBe("300");
    expect(book.get("rules.editionThreshold").standing).toEqual({
      kind: "absolute",
      ref: "D89",
    });
    expect(book.get("rules.version").standing).toEqual({
      kind: "proposed",
      ref: "P26",
    });
    expect(book.get("rules.version").maturity).toBe("live");
  });

  it("counts the manifest bundled with the site (e252d5f, TDH v1.4)", () => {
    expect(show("manifest.proved")).toBe("84");
    // Theorems are told apart by their Lean names, not by the manifest's
    // English descriptions, which related theorems share.
    expect(show("manifest.distinct")).toBe("84");
    expect(show("manifest.noAxioms")).toBe("4");
    expect(show("manifest.shownFalse")).toBe("11");
    expect(show("manifest.shownFalse.kernel")).toBe("7");
    expect(show("manifest.shownFalse.evaluation")).toBe("4");
    expect(show("manifest.limits")).toBe("12");
    expect(show("manifest.entries")).toBe("107");
    expect(show("manifest.audited")).toBe("91");
    expect(show("manifest.audited.tdh")).toBe("61");
    expect(show("manifest.audited.p53")).toBe("30");
    expect(show("manifest.vectors.passed")).toBe("108");
    expect(show("manifest.vectors.total")).toBe(show("rules.vectors"));
    expect(show("manifest.vectors.checks")).toBe("1,336");
    expect(show("manifest.lean")).toBe("4.35.0");
    expect(show("manifest.commit")).toBe("e252d5f");
    expect(show("manifest.writtenAt")).toBe("Oct 18, 15:05 UTC");
    expect(show("manifest.headline.name")).toBe(
      "Tdh.Proofs.replayHoldings_invariance"
    );
    expect(show("manifest.headline.file")).toBe("NetInvariance.lean");
    expect(show("manifest.headline.line")).toBe("579");
    expect(show("manifest.sections.count")).toBe("9");
    // the bundled copy states no SHA-256 of the file as served
    expect(book.maybe("manifest.sha256")).toBeNull();
  });

  it("computes editions, rates and boosts with the engine on the real editions", () => {
    expect(show("memes.count")).toBe("562");
    expect(show("memes.seasons")).toBe("17");
    expect(show("memes.readAt")).toBe("06:35 UTC");
    expect(show("engine.H")).toBe("3,941");
    expect(show("meme.2.edition")).toBe("1,000");
    expect(show("meme.2.rate")).toBe("3.94");
    expect(show("meme.3.edition")).toBe("1,001");
    expect(show("meme.4.edition")).toBe("301");
    expect(show("meme.4.rate")).toBe("13.09");
    expect(show("meme.562.minted")).toBe("152");
    expect(show("meme.562.edition")).toBe("310");
    expect(show("engine.rate.310")).toBe("12.71");
    expect(show("engine.rate.firstGM")).toBe("1.00");
    expect(show("engine.rate.gradient")).toBe("39.02");
    expect(show("engine.boost.oneGradient")).toBe("1.02");
    expect(show("engine.boost.fullSet")).toBe("1.80");
    expect(show("engine.boost.todayMax")).toBe("2.04");
    expect(show("engine.boost.ceiling")).toBe("2.24");
    expect(show("engine.machine.default")).toBe("394");
  });

  it("counts a card still minting at 6529.io's own edition when its claim is not recorded", () => {
    const inputs = fixtureFactInputs();
    const editions = inputs.editions!;
    const live = createFactBook({
      ...inputs,
      editions: {
        ...editions,
        claimLimits: {},
        cards: [
          ...editions.cards,
          {
            id: 563,
            season: 17,
            minted: 155,
            firstMint: null,
            edition: 310,
          },
        ],
      },
    });
    const said = (id: FactId) => fmt(live.get(id), "en-US", "short");
    expect(said("meme.563.minted")).toBe("155");
    expect(said("meme.563.edition")).toBe("310");
    expect(said("meme.563.rate")).toBe("12.71");
    // Without a recorded claim or 6529.io's edition, the minted count stands.
    expect(said("meme.562.edition")).toBe("152");
  });

  it("reads 6529.io's values with their sources", () => {
    expect(show("site.mainStage.decisions")).toBe("221");
    expect(show("site.mainStage.through")).toBe("Oct 16");
    expect(show("site.mainStage.next")).toBe("Oct 19, 16:00 UTC");
    expect(show("site.proofA.cycle")).toBe("20,737");
    expect(show("site.proofA.totalWithoutBurn")).toBe("2,060,802,863");
    expect(show("site.validator.version")).toBe("0.1.0");
    expect(nextDecisionAfter("2026-10-19T16:00:00Z", [1, 3, 5], 16)).toBe(
      "2026-10-21T16:00:00Z"
    );
    expect(nextDecisionAfter("2026-10-23T15:59:59Z", [1, 3, 5], 16)).toBe(
      "2026-10-23T16:00:00Z"
    );
  });

  it("formats by locale, and never localizes a hash", () => {
    const total = book.get("tdh.latest.total");
    expect(fmt(total, "de-DE")).toBe("2.082.190.981");
    expect(fmt(total, "fr-FR").replace(/\s/g, " ")).toBe("2 082 190 981");
    expect(fmt(book.get("tdh.latest.ruleId"), "de-DE")).toBe(
      "0x63e242fa…163bcf22"
    );
    expect(fmt(book.get("engine.rate.310"), "de-DE")).toBe("12,71");
  });

  it("gives every fact a source, and every source a refresh", () => {
    for (const id of Object.keys(FACT_REGISTRY) as FactId[]) {
      const entry = book.snapshot().facts[id];
      expect(entry).toBeDefined();
      expect(entry?.source.ref.length).toBeGreaterThan(8);
      expect(entry?.source.refresh.length).toBeGreaterThan(3);
      expect([
        "feed",
        "manifest",
        "api",
        "decision",
        "spec",
        "site",
        "engine",
        "example",
      ]).toContain(entry?.source.kind);
    }
  });

  it("fails on an unknown id, for a static fact and for a family member", () => {
    expect(() => book.get("tdh.latest.totl" as FactId)).toThrow(
      UnknownFactError
    );
    expect(() => book.get("meme.9999.edition")).toThrow(/no Meme #9999/);
    expect(() => book.get("decision.D999")).toThrow(/no D999/);
    expect(isKnownFactId("tdh.latest.total")).toBe(true);
    expect(isKnownFactId("tdh.latest.totl")).toBe(false);
  });

  it("resolves a decision's summary with its standing", () => {
    const d136 = book.get<string>("decision.D136");
    expect(d136.value).toMatch(
      /^TDH v1\.4 counts consolidations of up to four wallets/
    );
    expect(d136.standing).toEqual({ kind: "decided", ref: "D136" });
  });

  it("marks facts unavailable when the feed is down, and never invents a number", () => {
    const down = createFactBook({ ...fixtureFactInputs(), feed: null });
    expect(down.maybe("tdh.latest.total")).toBeNull();
    expect(() => down.get("tdh.latest.total")).toThrow(/unavailable/);
    // facts from other sources still resolve
    expect(down.get("rules.version").value).toBe("tdh-v1.4");
    // the cutover falls back to the decision when the feed does not say
    expect(fmt(down.get("tdh.cutover.about"), "en-US")).toBe("Oct 23");
  });

  it("hands the client a snapshot it can read, and the page its sources as JSON", () => {
    book.get("meme.562.edition");
    const snapshot = JSON.parse(JSON.stringify(book.snapshot())) as ReturnType<
      typeof book.snapshot
    >;
    expect(snapshot.asOf).toBe(FIXTURE_NOW);
    expect((factFromSnapshot(snapshot, "meme.562.edition") as Fact).value).toBe(
      310
    );
    expect(() => factFromSnapshot(snapshot, "meme.561.edition")).toThrow(
      /not resolved on the server/
    );
    const json = JSON.parse(factsAsJson(snapshot)) as {
      facts: { id: string; source: { ref: string } }[];
    };
    const total = json.facts.find((entry) => entry.id === "tdh.latest.total");
    expect(total?.source.ref).toBe("the public TDH feed, days/20744.json");
  });
});
