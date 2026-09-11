import { getCmsPageSocialImage } from "@/lib/profile-cms/runtime/social-image";
import { instantiateCmsStudioTemplate } from "@/lib/profile-cms/studio/templates";

describe("CMS page sharing image", () => {
  it("uses the first displayed image instead of an unrelated package asset", () => {
    const document = instantiateCmsStudioTemplate("signature", "example6529");
    const page = document.payload.pages[0]!;
    const image = getCmsPageSocialImage(document, page, "https://6529.io");
    expect(image?.url).toBe(
      "https://6529.io/profile-cms/templates/quiet-signal.png"
    );
  });

  it("gives an explicit sharing image priority", () => {
    const document = instantiateCmsStudioTemplate("chapters", "example6529");
    const page = document.payload.pages[0]!;
    page.metadata.social_image_asset_id = "demo-night-grid";
    expect(getCmsPageSocialImage(document, page, "https://6529.io")?.url).toBe(
      "https://6529.io/profile-cms/templates/night-grid.png"
    );
  });

  it("uses a verified static poster for an animated Meme without replacing its signed source", () => {
    const document = instantiateCmsStudioTemplate(
      "meme-after-hours",
      "example6529"
    );
    const page = document.payload.pages[0]!;
    const before = JSON.stringify(document);
    const image = getCmsPageSocialImage(
      document,
      page,
      "https://staging.6529.io"
    );
    expect(image?.url).toBe(
      "https://staging.6529.io/profile-cms/templates/memes/5.webp"
    );
    expect(image?.asset.mime_type).toBe("image/webp");
    expect(JSON.stringify(document)).toBe(before);
  });

  it("does not invent a sharing image for a text-only page", () => {
    const document = instantiateCmsStudioTemplate("signature", "example6529");
    const page = document.payload.pages.find(
      (item) => item.id === "page-about"
    )!;
    expect(getCmsPageSocialImage(document, page, "https://6529.io")).toBeNull();
  });
});
