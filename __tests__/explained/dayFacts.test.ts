import {
  UnknownFactError,
  createFactBook,
  isKnownFactId,
  type FactId,
} from "@/lib/explained/facts";
import type { FactInputs } from "@/lib/explained/factInputs";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";
import { dayFactIds } from "@/lib/explained/registry/dayFacts";

/**
 * A published day's facts (`tdh.day.{cycle}.{field}`): the latest day's
 * facts of the same name, read from that day's own file, so a receipt of
 * any day prints its numbers through facts that name the day.
 */
const inputs = fixtureFactInputs();
const book = createFactBook(inputs);

describe("a day's facts", () => {
  it("are the latest day's facts for the latest day", () => {
    for (const field of [
      "total",
      "cycle",
      "roots.cycle",
      "file.sha256",
      "delta",
    ]) {
      expect(book.get(`tdh.day.20744.${field}` as FactId).value).toEqual(
        book.get(`tdh.latest.${field}` as FactId).value
      );
    }
  });

  it("read an older day from its own file, with its own change and source", () => {
    const total = book.get<number>("tdh.day.20742.total");
    expect(total.value).toBe(2_076_145_154);
    expect(total.source.ref).toBe("the public TDH feed, days/20742.json");
    expect(book.num("tdh.day.20742.delta")).toBe(2_076_145_154 - 2_073_214_934);
    expect(book.text("tdh.day.20742.file.sha256")).toBe(
      "5303491ce74915fdc63356ce6f43257a6a34fdb8a5c6bb5fd1736ebfce711e92"
    );
    // The file the server read hashes to what the index states.
    expect(book.text("tdh.day.20742.file.sha256Read")).toBe(
      book.text("tdh.day.20742.file.sha256")
    );
  });

  it("have no change on the first day, which has no day before it", () => {
    expect(book.maybe("tdh.day.20740.delta")).toBeNull();
    expect(book.num("tdh.day.20740.total")).toBe(2_070_436_337);
  });

  it("name the newer decision when a file reports the retired rule name", () => {
    expect(book.get("tdh.day.20741.ruleVersion").drift).toEqual({
      by: "D137",
      says: "rules.version",
    });
  });

  it("are unavailable for a day whose file the page did not read", () => {
    const latestOnly: FactInputs = {
      ...inputs,
      feed: inputs.feed ? { ...inputs.feed, days: [inputs.feed.latest] } : null,
    };
    const narrow = createFactBook(latestOnly);
    expect(narrow.maybe("tdh.day.20742.total")).toBeNull();
    expect(narrow.snapshot().facts["tdh.day.20742.total"]?.source.ref).toBe(
      "the public TDH feed, days/20742.json"
    );
    expect(narrow.maybe("tdh.day.20744.total")).not.toBeNull();
  });

  it("know only the latest day's fields, so a typo fails", () => {
    expect(isKnownFactId("tdh.day.20744.total")).toBe(true);
    expect(isKnownFactId("tdh.day.020744.total")).toBe(false);
    expect(() => book.get("tdh.day.020744.total" as FactId)).toThrow(
      UnknownFactError
    );
    // A field the latest day does not have fails when it is resolved, as a
    // card or a decision the registry does not have does.
    expect(() => book.get("tdh.day.20744.totl" as FactId)).toThrow(
      /Unknown fact "tdh\.day\.20744\.totl"/
    );
  });

  it("list every field of a day, to resolve before a page's snapshot", () => {
    const ids = dayFactIds(20743);
    expect(ids).toContain("tdh.day.20743.total");
    expect(ids).toContain("tdh.day.20743.file.sha256Read");
    expect(ids.every((id) => isKnownFactId(id))).toBe(true);
  });
});
