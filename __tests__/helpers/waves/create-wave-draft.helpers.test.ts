import type { CreateWaveDraft } from "@/helpers/waves/create-wave-draft.helpers";
import {
  deleteCreateWaveDraft,
  readCreateWaveDrafts,
  upsertCreateWaveDraft,
} from "@/helpers/waves/create-wave-draft.helpers";

const STORAGE_KEY = "create-wave-drafts:v1";

const makeDraft = (
  id: string,
  updatedAt: number,
  name = `Wave ${id}`
): CreateWaveDraft =>
  ({
    id,
    updatedAt,
    config: {
      overview: { type: "CHAT", name, image: null },
    },
    endDateConfig: { time: null, period: null },
  }) as unknown as CreateWaveDraft;

describe("create-wave-draft.helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a draft and sorts newest first", () => {
    upsertCreateWaveDraft(makeDraft("a", 100));
    upsertCreateWaveDraft(makeDraft("b", 200));

    const drafts = readCreateWaveDrafts();
    expect(drafts.map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("updates an existing draft in place instead of forking it", () => {
    upsertCreateWaveDraft(makeDraft("a", 100, "First name"));
    upsertCreateWaveDraft(makeDraft("a", 200, "Second name"));

    const drafts = readCreateWaveDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.config.overview.name).toBe("Second name");
  });

  it("never persists the image File", () => {
    const draft = makeDraft("a", 100);
    upsertCreateWaveDraft({
      ...draft,
      config: {
        ...draft.config,
        overview: {
          ...draft.config.overview,
          image: new File(["x"], "x.png") as unknown as null,
        },
      },
    });

    expect(readCreateWaveDrafts()[0]!.config.overview.image).toBeNull();
  });

  it("deletes a draft by id", () => {
    upsertCreateWaveDraft(makeDraft("a", 100));
    upsertCreateWaveDraft(makeDraft("b", 200));

    deleteCreateWaveDraft("b");

    expect(readCreateWaveDrafts().map((d) => d.id)).toEqual(["a"]);
  });

  it("evicts the oldest drafts beyond the cap", () => {
    for (let index = 0; index < 10; index += 1) {
      upsertCreateWaveDraft(makeDraft(`draft-${index}`, index));
    }

    const drafts = readCreateWaveDrafts();
    expect(drafts).toHaveLength(8);
    expect(drafts[0]!.id).toBe("draft-9");
    expect(drafts.some((d) => d.id === "draft-0")).toBe(false);
    expect(drafts.some((d) => d.id === "draft-1")).toBe(false);
  });

  it("survives corrupted storage", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(readCreateWaveDrafts()).toEqual([]);

    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ nonsense: true }]));
    expect(readCreateWaveDrafts()).toEqual([]);

    // A write on top of corruption recovers cleanly.
    upsertCreateWaveDraft(makeDraft("a", 100));
    expect(readCreateWaveDrafts()).toHaveLength(1);
  });
});
