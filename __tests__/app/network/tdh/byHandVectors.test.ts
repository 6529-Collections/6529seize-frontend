import { PUBLIC_VECTORS_JSON } from "@/components/explained/engine/publicVectors";
import {
  canonicalJson,
  isObject,
  parseJsonExact,
} from "@/components/explained/engine/json";
import { runVector } from "@/components/explained/engine/vectors";
import { EN_US_MESSAGES } from "@/i18n/messages/en-US";
import { createFactBook } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";

/**
 * The vectors the Implementations page restates for checking by hand: the
 * five public ones it lists, each described on the page, each served whole
 * at /network/tdh/public-vectors.json, and each reproduced by the TDH v1.4
 * engine from that file's own text.
 */
const book = createFactBook(fixtureFactInputs());
const listed = book.get<string[]>("vectors.public").value;
const doc = parseJsonExact(PUBLIC_VECTORS_JSON);
const served = isObject(doc) && isObject(doc["vectors"]) ? doc["vectors"] : {};

describe("vectors restated for checking by hand", () => {
  it("are the public vectors the file serves, each with its line on the page", () => {
    expect(listed).toEqual(Object.keys(served));
    for (const id of listed) {
      expect(
        Object.hasOwn(EN_US_MESSAGES, `explained.tdh.impl.public.${id}`)
      ).toBe(true);
    }
  });

  it.each(listed)("%s passes on the TDH v1.4 engine, as served", (id) => {
    const vector = served[id];
    expect(vector).toBeDefined();
    const run = runVector(id, canonicalJson(vector ?? null));
    expect(run.failures).toEqual([]);
    expect(run.status).not.toBe("fail");
  });
});
