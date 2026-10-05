import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import { ApiOgMetadataEntityType } from "@/generated/models/ApiOgMetadataEntityType";
import type { ApiOgMetadata } from "@/generated/models/ApiOgMetadata";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { JsonLdObject } from "@/lib/structured-data/types";
import { buildWavePageJsonLd } from "@/lib/structured-data/waves";
import { serializeJsonLd } from "@/lib/structured-data/json-ld";

const createdAt = 1790634155501;
const path = "/waves/wave-id?drop=drop-id";
const wave = {
  id: "wave-id",
  name: "Public wave",
  created_at: createdAt,
  author: { handle: "wave-author" },
} as ApiWave;

function metadata(): ApiOgMetadata {
  return {
    entity_type: ApiOgMetadataEntityType.Drop,
    entity_id: "drop-id",
    author: { id: "author-id", handle: "author" },
    drop: {
      id: "drop-id",
      serial_no: 1473870,
      drop_type: ApiDropMainType.Chat,
      created_at: createdAt,
      submitted_at: null,
      content: "gm meme",
      media: [],
    },
  };
}

function graph(dropMetadata: ApiOgMetadata | null): readonly JsonLdObject[] {
  // Exercise the serialized output consumed by crawlers, including compaction.
  return JSON.parse(
    serializeJsonLd(buildWavePageJsonLd({ wave, path, dropMetadata }))
  )["@graph"];
}

function posting(dropMetadata: ApiOgMetadata): JsonLdObject | undefined {
  return graph(dropMetadata).find(
    (node) => node["@type"] === "SocialMediaPosting"
  );
}

describe("wave drop structured data", () => {
  it.each([ApiDropMainType.Chat, ApiDropMainType.Submission])(
    "uses the original publication time and required text for %s",
    (dropType) => {
      const data = metadata();
      data.drop!.drop_type = dropType;
      data.drop!.submitted_at =
        dropType === ApiDropMainType.Submission ? createdAt : null;
      data.drop!.won_at = createdAt + 86400000;
      const post = posting(data);

      expect(post).toMatchObject({
        datePublished: "2026-09-28T22:22:35.501Z",
        text: "gm meme",
        author: { "@type": "Person", name: "author" },
      });
      expect(post).not.toHaveProperty("articleBody");
      expect(post).not.toHaveProperty("headline");
    }
  );

  it.each([
    undefined,
    null,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    8.64e15 + 1,
  ])(
    "omits the post when publication time is missing or invalid (%s)",
    (value) => {
      const data = metadata();
      // Simulate malformed or pre-rollout JSON despite the new required contract.
      Object.assign(data.drop!, { created_at: value, submitted_at: null });
      const nodes = graph(data);
      expect(nodes.some((node) => node["@type"] === "SocialMediaPosting")).toBe(
        false
      );
      expect(
        nodes.find((node) => node["@type"] === "Collection")
      ).toBeDefined();
      expect(
        nodes.find(
          (node) =>
            Array.isArray(node["@type"]) && node["@type"].includes("WebPage")
        )
      ).toMatchObject({
        mainEntity: { "@id": expect.stringContaining("#wave") },
      });
    }
  );

  it("does not use submission, winner, or wave time when publication time is absent", () => {
    const data = metadata();
    Object.assign(data.drop!, {
      created_at: undefined,
      submitted_at: createdAt,
      won_at: createdAt,
    });
    expect(posting(data)).toBeUndefined();
  });

  it("supports the Unix epoch without replacing it with the current time", () => {
    const data = metadata();
    data.drop!.created_at = 0;
    expect(posting(data)?.["datePublished"]).toBe("1970-01-01T00:00:00.000Z");
  });

  it("represents image-only and video-only posts with the correct media property", () => {
    const data = metadata();
    data.drop!.content = null;
    data.drop!.media = [
      { url: "https://media.example.test/image.png", mime_type: "image/png" },
    ];
    expect(posting(data)).toMatchObject({
      image: ["https://media.example.test/image.png"],
    });
    expect(posting(data)).not.toHaveProperty("text");

    data.drop!.media = [
      { url: "https://media.example.test/video.mp4", mime_type: "video/mp4" },
    ];
    expect(posting(data)).toMatchObject({
      video: [
        {
          "@type": "VideoObject",
          contentUrl: "https://media.example.test/video.mp4",
        },
      ],
    });
    expect(posting(data)).not.toHaveProperty("image");
  });

  it("omits empty, unsupported, and invalid media posts instead of using wave or author images", () => {
    const data = metadata();
    data.drop!.content = " ";
    data.drop!.media = [
      { url: "https://media.example.test/audio.mp3", mime_type: "audio/mpeg" },
      { url: "javascript:alert(1)", mime_type: "image/png" },
    ];
    expect(posting(data)).toBeUndefined();
  });

  it("uses nonempty description text when content is empty", () => {
    const data = metadata();
    data.drop!.content = " ";
    data.drop!.description = "Submission description";
    expect(posting(data)?.["text"]).toBe("Submission description");
  });

  it("requires an author name and can use the author's address", () => {
    const data = metadata();
    delete data.author;
    expect(posting(data)).toBeUndefined();
    data.author = { id: "author-id", handle: " ", primary_address: " " };
    expect(posting(data)).toBeUndefined();
    data.author.primary_address = "0x123";
    expect(posting(data)).toMatchObject({ author: { name: "0x123" } });
  });

  it("does not emit a post when protected or unavailable metadata was not returned", () => {
    expect(
      graph(null).some((node) => node["@type"] === "SocialMediaPosting")
    ).toBe(false);
  });
});
