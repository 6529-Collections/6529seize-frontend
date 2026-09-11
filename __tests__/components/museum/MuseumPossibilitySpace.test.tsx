import { fireEvent, render, screen } from "@testing-library/react";
import { MuseumInTheSystem } from "@/components/museum/MuseumInsideSystem";
import { MuseumPossibilitySpace } from "@/components/museum/MuseumPossibilitySpace";
import { suggestionTokens } from "@/components/museum/possibility-space/ComparisonExplorer";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import {
  getGenerativeStudyByObjectId,
  getGenerativeStudyByProjectSlug,
} from "@/lib/museum/generative-studies";
import type {
  MuseumGenerativeStudy,
  MuseumMintedProjectIndex,
} from "@/lib/museum/generative-studies";

function mintedIndexFor(
  study: MuseumGenerativeStudy
): MuseumMintedProjectIndex {
  const heldTokens = study.heldPositions.map((position, index) => {
    const invocation = Number.parseInt(
      /#(?<invocation>\d+)$/u.exec(position.title)?.groups?.["invocation"] ??
        `${index}`,
      10
    );
    return {
      invocation,
      tokenId: `${invocation}`,
      tokenHash: `0x${invocation.toString(16).padStart(64, "0")}`,
      mediaUrl: `https://example.com/${study.projectSlug}-${invocation}.png`,
      traits: Object.fromEntries(
        position.coordinates.map((item) => [item.label, item.value])
      ),
      editionProfile: { statisticalRank: index + 1, total: 2 },
    };
  });
  const comparisonToken = {
    invocation: 1,
    tokenId: "1",
    tokenHash: `0x${"1".padStart(64, "0")}`,
    mediaUrl: `https://example.com/${study.projectSlug}-1.png`,
    traits: heldTokens[0]?.traits ?? {},
    editionProfile: { statisticalRank: 2, total: 2 },
  };
  return {
    schema: "museum.generative.minted-index.v2",
    projectSlug: study.projectSlug,
    snapshotId: "test-snapshot",
    observedAt: "2026-08-04T00:00:00Z",
    population: {},
    descriptor: {
      algorithmId: "6529-nextgen-trait-prevalence-v1",
      resultSha256: "sha256:test",
      reviewRef: "descriptor-package-review-2026-08-02",
    },
    tokens: [...heldTokens, comparisonToken],
  };
}

describe("Museum possibility-space explorer", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("exposes all 120 Pre-Process positions and supports grid keys", () => {
    const study = getGenerativeStudyByProjectSlug("pre-process");
    if (study === null) throw new Error("test_study_missing");

    render(
      <MuseumPossibilitySpace
        study={study}
        locale={DEFAULT_LOCALE}
        mintedIndex={mintedIndexFor(study)}
      />
    );

    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(120);
    fireEvent.click(screen.getByRole("button", { name: "Restage a session" }));
    const held = screen.getByRole("gridcell", {
      name: /Surface 8, Origin 1 · Center, Growth 4, Museum work/u,
    });
    expect(held).toHaveAttribute("aria-selected", "true");
    expect(held).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(held, { key: "ArrowLeft" });
    expect(
      screen.getByRole("gridcell", {
        name: "Surface 8, Origin 1 · Center, Growth 3",
      })
    ).toHaveAttribute("aria-selected", "true");
  });

  it("offers a semantic table alternative", () => {
    const study = getGenerativeStudyByProjectSlug("pre-process");
    if (study === null) throw new Error("test_study_missing");

    render(
      <MuseumPossibilitySpace
        study={study}
        locale={DEFAULT_LOCALE}
        mintedIndex={mintedIndexFor(study)}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Show data table" }));

    expect(
      screen.getByRole("table", {
        name: "Possibility-space data for Pre-Process",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("◆ Pre-Process #63")).toBeInTheDocument();
  });

  it("renders every enabled 923 EMPTY ROOMS color pass", () => {
    const study = getGenerativeStudyByProjectSlug("923-empty-rooms");
    if (study === null) throw new Error("test_study_missing");
    const sourceIndex = mintedIndexFor(study);
    const index = {
      ...sourceIndex,
      tokens: sourceIndex.tokens.map((token, tokenIndex) =>
        tokenIndex === sourceIndex.tokens.length - 1
          ? {
              ...token,
              traits: {
                "# Shapes": "2",
                "# Suns": "1",
                "# Shards": "1",
                "# Cargos": "0",
                "# Hives": "0",
                "# Pyramids": "0",
                "# Moons": "0",
                Code: "12",
                Red: "true",
                Green: "false",
                Blue: "true",
              },
            }
          : token
      ),
    };
    window.history.replaceState(
      {},
      "",
      "/museum/network/projects/923-empty-rooms/system?compare=1"
    );

    const { container } = render(
      <MuseumPossibilitySpace
        study={study}
        locale={DEFAULT_LOCALE}
        mintedIndex={index}
      />
    );

    expect(screen.getByText(/Red \+ Blue depth field/u)).toBeInTheDocument();
    expect(container.querySelector('g[stroke="#f97066"]')).not.toBeNull();
    expect(container.querySelector('g[stroke="#528bff"]')).not.toBeNull();
    expect(container.querySelector('g[stroke="#3ccb7f"]')).toBeNull();
  });

  it("reproduces a versioned Museum-model variation from its URL", () => {
    const study = getGenerativeStudyByProjectSlug("century");
    if (study === null) throw new Error("test_study_missing");
    const index = mintedIndexFor(study);
    window.history.replaceState(
      {},
      "",
      "/museum/network/projects/century/system?compare=1&mode=model"
    );

    const firstRender = render(
      <MuseumPossibilitySpace
        study={study}
        locale={DEFAULT_LOCALE}
        mintedIndex={index}
      />
    );
    fireEvent.change(screen.getByLabelText("Palette"), {
      target: { value: "C" },
    });

    const savedUrl = new URL(window.location.href);
    expect(savedUrl.searchParams.get("modelVersion")).toBe("1");
    expect(savedUrl.searchParams.get("mPalette")).toBe("C");
    fireEvent.change(screen.getByLabelText("Initial strip order"), {
      target: { value: "Cosmos" },
    });
    fireEvent.click(screen.getByLabelText("Oculi"));
    expect(savedUrl.searchParams.get("modelVersion")).toBe("1");
    expect(new URL(window.location.href).searchParams.get("mOrder")).toBe(
      "Cosmos"
    );
    expect(new URL(window.location.href).searchParams.get("mOculi")).toBe("1");
    expect(
      screen.getByRole("img", { name: "CENTURY #31" })
    ).toBeInTheDocument();

    firstRender.unmount();
    render(
      <MuseumPossibilitySpace
        study={study}
        locale={DEFAULT_LOCALE}
        mintedIndex={index}
      />
    );
    expect(screen.getByLabelText("Palette")).toHaveValue("C");
    expect(screen.getByLabelText("Initial strip order")).toHaveValue("Cosmos");
  });

  it("keeps suggestion meanings attached after overlapping ranks are deduplicated", () => {
    const token = (
      invocation: number,
      traits: Record<string, string>,
      statisticalRank: number
    ) => ({
      invocation,
      tokenId: `${invocation}`,
      tokenHash: `0x${invocation.toString(16).padStart(64, "0")}`,
      mediaUrl: `https://example.com/${invocation}.png`,
      traits,
      editionProfile: { statisticalRank, total: 4 },
    });
    const museumToken = token(31, { Palette: "A", Oculi: "True" }, 4);
    const index: MuseumMintedProjectIndex = {
      schema: "museum.generative.minted-index.v2",
      projectSlug: "century",
      snapshotId: "test-snapshot",
      observedAt: "2026-08-04T00:00:00Z",
      population: {},
      descriptor: {
        algorithmId: "6529-nextgen-trait-prevalence-v1",
        resultSha256: "sha256:test",
        reviewRef: "descriptor-package-review-2026-08-02",
      },
      tokens: [
        museumToken,
        token(1, { Palette: "A", Oculi: "True" }, 3),
        token(401, { Palette: "D", Oculi: "False" }, 1),
        token(2, { Palette: "A", Oculi: "False" }, 2),
      ],
    };

    expect(
      suggestionTokens(index, museumToken).map((suggestion) => [
        suggestion.kind,
        suggestion.token.invocation,
      ])
    ).toEqual([
      ["nearest", 1],
      ["complement", 401],
      ["uncommon", 2],
    ]);
  });

  it("renders all published Phototaxis controls and preserves Façade metadata", () => {
    const study = getGenerativeStudyByProjectSlug("phototaxis");
    if (study === null) throw new Error("test_study_missing");
    const sourceIndex = mintedIndexFor(study);
    const index: MuseumMintedProjectIndex = {
      ...sourceIndex,
      tokens: sourceIndex.tokens.map((token) =>
        token.invocation === 1
          ? {
              ...token,
              traits: {
                Size: "Small",
                Speed: "Slow",
                Lights: "2",
                Façade: "Silt",
                Sensors: "Linear",
                Alignment: "Chaotic",
                Population: "Cluster",
                Magnification: "2.0",
              },
            }
          : token
      ),
    };
    window.history.replaceState(
      {},
      "",
      "/museum/network/projects/phototaxis/system?compare=1"
    );
    const mintedView = render(
      <MuseumPossibilitySpace
        study={study}
        locale={DEFAULT_LOCALE}
        mintedIndex={index}
      />
    );
    expect(screen.getByText(/Silt · 100 machines · 2 lights/u)).toBeVisible();
    mintedView.unmount();

    window.history.replaceState(
      {},
      "",
      "/museum/network/projects/phototaxis/system?compare=1&mode=model"
    );
    render(
      <MuseumPossibilitySpace
        study={study}
        locale={DEFAULT_LOCALE}
        mintedIndex={index}
      />
    );
    for (const label of [
      "Machine size",
      "Sensor response",
      "Alignment",
      "Magnification",
    ]) {
      expect(screen.getByLabelText(label)).toBeVisible();
    }
  });

  it("opens the requested Museum position and keeps selection shareable", () => {
    const study = getGenerativeStudyByProjectSlug("century");
    if (study === null) throw new Error("test_study_missing");
    window.history.replaceState(
      {},
      "",
      "/museum/network/projects/century/system"
    );

    render(
      <MuseumPossibilitySpace
        study={study}
        locale={DEFAULT_LOCALE}
        mintedIndex={mintedIndexFor(study)}
        initialWorkId="6529NM.2026.001.02"
      />
    );

    expect(
      screen.getByRole("heading", { name: "CENTURY #724" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "#724" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.click(screen.getByRole("button", { name: "#401" }));
    expect(new URL(window.location.href).searchParams.get("work")).toBe(
      "6529NM.2026.001.03"
    );
    expect(window.location.hash).toBe("#possibility-space");
  });

  it("deep-links an object to its project map", () => {
    const study = getGenerativeStudyByObjectId("6529NM.2026.001.04");
    if (study === null) throw new Error("test_study_missing");
    const position = study.heldPositions[0];
    if (position === undefined) throw new Error("test_position_missing");

    render(<MuseumInTheSystem study={study} position={position} />);

    expect(
      screen.getByRole("link", { name: "Locate this work in the full system" })
    ).toHaveAttribute(
      "href",
      "/museum/network/projects/pre-process/system?work=6529NM.2026.001.04#possibility-space"
    );
    expect(screen.getByText("4 · All large")).toBeInTheDocument();
  });
});
