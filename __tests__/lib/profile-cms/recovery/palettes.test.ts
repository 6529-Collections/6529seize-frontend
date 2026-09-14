import { CMS_STUDIO_DESIGNS } from "@/lib/profile-cms/studio/presentation";
import {
  getCmsColorways,
  resolveCmsColorway,
} from "@/lib/profile-cms/studio/palettes";
import { instantiateCmsStudioTemplate } from "@/lib/profile-cms/studio/templates";
import { withComputedCmsHashes } from "@/lib/profile-cms/protocol/v1";
import { recoveredColorwayStyles } from "@/lib/profile-cms/recovery/native-presentation";
import { renderRecoveredCmsSite } from "@/lib/profile-cms/recovery/static-site";

describe.each(CMS_STUDIO_DESIGNS)(
  "%s independent recovery colourways",
  (design) => {
    it("recovers every selected palette from package data without altering the package", () => {
      const cmsPackage = instantiateCmsStudioTemplate(design, "Example");
      for (const choice of getCmsColorways(design)) {
        cmsPackage.site.theme.tokens!["studio_colorway"] = choice.id;
        cmsPackage.site.theme.accent = choice.accent;
        const original = JSON.stringify(cmsPackage);
        const style = recoveredColorwayStyles(cmsPackage);
        const variables = resolveCmsColorway(design, choice.id, choice.accent)!;
        for (const [name, value] of Object.entries(variables))
          expect(style).toContain(`${name}:${value}`);
        expect(JSON.stringify(cmsPackage)).toBe(original);
        expect(style).not.toMatch(/https?:|url\(|<script/i);
      }
    });

    it("applies the selected colours on every exported page while retaining content and links", () => {
      const cmsPackage = instantiateCmsStudioTemplate(design, "Example");
      cmsPackage.site.theme.tokens!["studio_colorway"] = "plum";
      const signed = withComputedCmsHashes(cmsPackage);
      const packageBefore = JSON.stringify(signed);
      const files = renderRecoveredCmsSite(signed);
      const pages = [...files.entries()].filter(([path]) =>
        path.endsWith(".html")
      );
      expect(pages.length).toBeGreaterThanOrEqual(signed.payload.pages.length);
      for (const [, html] of pages) {
        expect(html).toContain("--cms-colorway-paper:#f1e9ef");
        expect(html).toContain("background:var(--cms-colorway-paper)");
        expect(html).toContain(signed.integrity.package_hash);
        expect(html).not.toContain("<script");
      }
      expect(JSON.stringify(signed)).toBe(packageBefore);
    });

    it("leaves legacy or unknown palette selections unstyled by the new system", () => {
      const cmsPackage = instantiateCmsStudioTemplate(design, "Example");
      delete cmsPackage.site.theme.tokens!["studio_colorway"];
      expect(recoveredColorwayStyles(cmsPackage)).toBe("");
      expect(
        [...renderRecoveredCmsSite(cmsPackage).values()].some((file) =>
          file.includes("--cms-colorway-")
        )
      ).toBe(false);
      cmsPackage.site.theme.tokens!["studio_colorway"] =
        "</style><script>bad()</script>";
      expect(recoveredColorwayStyles(cmsPackage)).toBe("");
    });
  }
);
