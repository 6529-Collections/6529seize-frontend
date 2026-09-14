import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";

import {
  getCmsColorways,
  resolveCmsColorway,
} from "@/lib/profile-cms/studio/palettes";
import { CMS_STUDIO_DESIGNS } from "@/lib/profile-cms/studio/presentation";

const stylesheets = ["approved.module.css", "ProjectMockup.module.css"].map(
  (name) => ({
    name,
    css: postcss.parse(
      readFileSync(
        join(process.cwd(), "components/profile-cms/approved-renderer", name),
        "utf8"
      )
    ),
  })
);

it.each(stylesheets)(
  "keeps every fixed colour in $name behind a legacy fallback",
  ({ css }) => {
    const unthemed: string[] = [];
    css.walkDecls((declaration) => {
      const withoutLegacyFallbacks = declaration.value.replace(
        /var\(\s*--cms-colorway-[\w-]+\s*,\s*(?:#[a-f\d]{3,8}|white|black)\s*\)/gi,
        ""
      );
      if (
        /#[a-f\d]{3,8}\b|rgba?\(|hsla?\(|\b(?:white|black)\b/i.test(
          withoutLegacyFallbacks
        )
      ) {
        unthemed.push(declaration.toString());
      }
    });
    expect(unthemed).toEqual([]);
  }
);

it("supplies every renderer colour role for every design and colourway", () => {
  const required = new Set<string>();
  for (const { css } of stylesheets) {
    css.walkDecls((declaration) => {
      for (const match of declaration.value.matchAll(
        /var\(\s*(--cms-colorway-[\w-]+)/g
      )) {
        required.add(match[1]!);
      }
    });
  }
  expect(required.size).toBeGreaterThan(70);
  const missing: string[] = [];
  for (const design of CMS_STUDIO_DESIGNS) {
    for (const choice of getCmsColorways(design)) {
      const variables = resolveCmsColorway(design, choice.id);
      for (const key of required) {
        if (!variables || !Object.hasOwn(variables, key))
          missing.push(`${design}/${choice.id}: ${key}`);
      }
    }
  }
  expect(missing).toEqual([]);
});
