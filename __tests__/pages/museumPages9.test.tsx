import { render } from "@testing-library/react";
import Fam2021Page, {
  generateMetadata as generateFam2021Metadata,
} from "@/app/museum/6529-fam-2021/page";
import ChromieSquigglePage, {
  generateMetadata as generateChromieSquiggleMetadata,
} from "@/app/museum/6529-fund-szn1/chromie-squiggle/page";
import ConflictingMetaphysicsPage, {
  generateMetadata as generateConflictingMetaphysicsMetadata,
} from "@/app/museum/6529-fund-szn1/conflicting-metaphysics/page";
import FundSzn2Page, {
  generateMetadata as generateFundSzn2Metadata,
} from "@/app/museum/6529-fund-szn2/page";
import BitDigitalPage, {
  generateMetadata as generateBitDigitalMetadata,
} from "@/app/museum/genesis/27-bit-digital/page";
import AlgobotsPage, {
  generateMetadata as generateAlgobotsMetadata,
} from "@/app/museum/genesis/algobots/page";
import AsemicaPage, {
  generateMetadata as generateAsemicaMetadata,
} from "@/app/museum/genesis/asemica/page";
import ChimeraPage, {
  generateMetadata as generateChimeraMetadata,
} from "@/app/museum/genesis/chimera/page";
import CosmicReefPage, {
  generateMetadata as generateCosmicReefMetadata,
} from "@/app/museum/genesis/cosmic-reef/page";
import GenesisDcaPage, {
  generateMetadata as generateGenesisDcaMetadata,
} from "@/app/museum/genesis/genesis-dca/page";
import { expectMigratedWordPressPageRenders } from "./migratedWordPressPageTestUtils";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("@/components/header/HeaderPlaceholder", () => () => (
  <div data-testid="placeholder" />
));

describe("museum pages content batch 9", () => {
  const pages = [
    {
      Component: Fam2021Page,
      generateMetadata: generateFam2021Metadata,
      title: "6529 FAM 2021 - 6529.io",
      heading: /6529 FAM 2021/i,
    },
    {
      Component: ChromieSquigglePage,
      generateMetadata: generateChromieSquiggleMetadata,
      title: "CHROMIE SQUIGGLE - 6529.io",
      heading: /CHROMIE SQUIGGLE/i,
    },
    {
      Component: ConflictingMetaphysicsPage,
      generateMetadata: generateConflictingMetaphysicsMetadata,
      title: "CONFLICTING METAPHYSICS - 6529.io",
      heading: /CONFLICTING METAPHYSICS/i,
    },
    {
      Component: FundSzn2Page,
      generateMetadata: generateFundSzn2Metadata,
      title: "6529 FUND SZN2 - 6529.io",
      heading: /6529 FUND SZN2/i,
    },
    {
      Component: BitDigitalPage,
      generateMetadata: generateBitDigitalMetadata,
      title: "27-BIT DIGITAL - 6529.io",
      heading: /27-BIT DIGITAL/i,
    },
    {
      Component: AlgobotsPage,
      generateMetadata: generateAlgobotsMetadata,
      title: "ALGOBOTS - 6529.io",
      heading: /ALGOBOTS/i,
    },
    {
      Component: AsemicaPage,
      generateMetadata: generateAsemicaMetadata,
      title: "ASEMICA - 6529.io",
      heading: /ASEMICA/i,
    },
    {
      Component: ChimeraPage,
      generateMetadata: generateChimeraMetadata,
      title: "CHIMERA - 6529.io",
      heading: /CHIMERA/i,
    },
    {
      Component: CosmicReefPage,
      generateMetadata: generateCosmicReefMetadata,
      title: "COSMIC REEF - 6529.io",
      heading: /COSMIC REEF/i,
    },
    {
      Component: GenesisDcaPage,
      generateMetadata: generateGenesisDcaMetadata,
      title: "GENESIS - 6529.io",
      heading: /GENESIS/i,
    },
  ];

  pages.forEach(({ Component, generateMetadata, title, heading }) => {
    it(`renders migrated ${title}`, async () => {
      await expectMigratedWordPressPageRenders({
        Component,
        generateMetadata,
        heading,
        title,
      });
    });
  });

  it("exposes Open Graph metadata via generateMetadata", () => {
    const metadata = generateFam2021Metadata();

    expect(metadata.openGraph).toMatchObject({
      siteName: "6529.io",
      title: "6529 FAM 2021 - 6529.io",
      type: "website",
    });
  });

  it("uses the migrated source marker instead of legacy WordPress wrappers", () => {
    const { container } = render(<Fam2021Page />);

    expect(container.querySelector("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
    expect(container.querySelector("#wrapper")).not.toBeInTheDocument();
    expect(container.querySelector("#main")).not.toBeInTheDocument();
    expect(container.querySelector("#content")).not.toBeInTheDocument();
  });

  it("exposes large-image Twitter metadata", () => {
    const metadata = generateChromieSquiggleMetadata();

    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      site: "@6529Collections",
    });
  });
});
