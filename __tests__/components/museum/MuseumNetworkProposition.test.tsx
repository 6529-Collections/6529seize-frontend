import { render, screen } from "@testing-library/react";
import { MuseumNetworkProposition } from "@/components/museum/MuseumNetworkProposition";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumPublicDocument } from "@/lib/museum/publication";

function document(
  kind: "open_museum_statement" | "onchain_transition",
  sourcePath: string
): MuseumPublicDocument {
  return {
    id: kind,
    kind,
    title: kind,
    markdown: "",
    sha256: null,
    sourcePath,
    artistIds: [],
    projectIds: [],
    giftIds: [],
    artworkIds: [],
  };
}

describe("MuseumNetworkProposition", () => {
  it("keeps public labels at 14px and narrative copy at 16px or larger", () => {
    render(
      <MuseumNetworkProposition
        commit={"a".repeat(40)}
        missionSourceUrl="https://github.com/6529-Collections/6529networkmuseum/blob/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/policies/founding-principles.md"
        openMuseum={document(
          "open_museum_statement",
          "docs/open-museum-statement.md"
        )}
        transition={document(
          "onchain_transition",
          "docs/onchain-transition.md"
        )}
      />
    );

    for (const key of [
      "museum.network.proposition.eyebrow",
      "museum.network.proposition.final.eyebrow",
      "museum.network.proposition.sources.title",
    ] as const) {
      expect(screen.getByText(t(DEFAULT_LOCALE, key))).toHaveClass(
        "tw-text-sm"
      );
    }

    for (const key of [
      "museum.network.proposition.ofNetwork.body4",
      "museum.network.proposition.today.collection.body",
      "museum.network.proposition.next.decisions.body",
    ] as const) {
      expect(screen.getByText(t(DEFAULT_LOCALE, key))).toHaveClass(
        "tw-text-base",
        "tw-leading-7"
      );
    }
  });
});
