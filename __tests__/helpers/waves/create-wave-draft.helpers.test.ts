import type { CreateWaveDraft } from "@/helpers/waves/create-wave-draft.helpers";
import type { CreateDropConfig } from "@/entities/IDrop";
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

  it("isolates first-post text between profile scopes", () => {
    const description: CreateDropConfig = {
      parts: [{ content: "Private first post", media: [], quoted_drop: null }],
      metadata: [],
      mentioned_users: [],
      referenced_nfts: [],
      signature: null,
    };
    upsertCreateWaveDraft(
      { ...makeDraft("private", 200), description },
      "wallet:profile-a"
    );
    expect(readCreateWaveDrafts("wallet:profile-b")).toEqual([]);
    expect(readCreateWaveDrafts("other-wallet:profile-a")).toEqual([]);
    expect(
      readCreateWaveDrafts("wallet:profile-a")[0]?.description?.parts[0]
        ?.content
    ).toBe("Private first post");
  });

  it("strips media, inline images, signatures, and signer information", () => {
    const description: CreateDropConfig = {
      parts: [
        {
          content:
            "Keep **this** text ![Seize](loading) ![photo](data:image/png;base64,secret)",
          media: [new File(["binary"], "private.jpg")],
          quoted_drop: null,
          clientId: "transient-id",
          attachments: [{ url: "secret-upload-url" } as never],
        },
      ],
      title: "First post title",
      metadata: [],
      mentioned_users: [],
      referenced_nfts: [],
      signature: "private-signature",
      signature_message: "private-signed-message",
      signer_address: "private-signer",
      is_safe_signature: true,
    };
    upsertCreateWaveDraft(
      { ...makeDraft("text", 200), description },
      "wallet:profile"
    );
    const serialized = localStorage.getItem(
      "create-wave-drafts:v2:wallet:profile"
    )!;
    for (const forbidden of [
      "private-signature",
      "private-signed-message",
      "private-signer",
      "secret-upload-url",
      "transient-id",
      "base64",
      "loading",
      "binary",
    ])
      expect(serialized).not.toContain(forbidden);
    const restored = readCreateWaveDrafts("wallet:profile")[0]!;
    // Preserve the author's remaining Markdown whitespace rather than trimming
    // line breaks or indentation while removing images.
    expect(restored.description?.parts[0]?.content).toBe("Keep **this** text  ");
    expect(restored.description?.parts[0]?.media).toEqual([]);
    expect(restored.mediaOmitted).toBe(true);
  });

  it("preserves legacy settings without importing unscoped post text", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          ...makeDraft("legacy", 100),
          description: { parts: [{ content: "Unscoped text" }] },
        },
      ])
    );
    const restored = readCreateWaveDrafts("wallet:profile")[0]!;
    expect(restored.settingsOnly).toBe(true);
    expect(restored.description).toBeNull();
    upsertCreateWaveDraft({ ...restored, updatedAt: 200 }, "wallet:profile");
    expect(readCreateWaveDrafts("wallet:profile")).toHaveLength(1);
    expect(readCreateWaveDrafts("other:profile")).toEqual([]);
    expect(readCreateWaveDrafts()).toEqual([]);
  });
});
