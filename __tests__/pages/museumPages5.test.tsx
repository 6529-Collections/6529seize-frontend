import MfersPage, {
  generateMetadata as generateMfersMetadata,
} from "@/app/museum/6529-fund-szn1/mfers/page";
import ACMuseumPage, {
  generateMetadata as generateACMuseumMetadata,
} from "@/app/museum/ac-museum/page";
import AlgorhythmsPage, {
  generateMetadata as generateAlgorhythmsMetadata,
} from "@/app/museum/genesis/algorhythms/page";
import EntretiemposPage, {
  generateMetadata as generateEntretiemposMetadata,
} from "@/app/museum/genesis/entretiempos/page";
import IgnitionPage, {
  generateMetadata as generateIgnitionMetadata,
} from "@/app/museum/genesis/ignition/page";
import WatercolorDreamsPage, {
  generateMetadata as generateWatercolorDreamsMetadata,
} from "@/app/museum/genesis/watercolor-dreams/page";
import { expectMigratedWordPressPageRenders } from "./migratedWordPressPageTestUtils";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("@/components/header/HeaderPlaceholder", () => () => (
  <div data-testid="placeholder" />
));

describe("museum pages content", () => {
  const pages = [
    {
      Component: MfersPage,
      generateMetadata: generateMfersMetadata,
      title: "mfers - 6529.io",
      heading: /MFERS/i,
    },
    {
      Component: ACMuseumPage,
      generateMetadata: generateACMuseumMetadata,
      title: "AC COLLECTION - 6529.io",
      heading: /AC COLLECTION/i,
    },
    {
      Component: AlgorhythmsPage,
      generateMetadata: generateAlgorhythmsMetadata,
      title: "ALGORHYTHMS - 6529.io",
      heading: /ALGORHYTHMS/i,
    },
    {
      Component: EntretiemposPage,
      generateMetadata: generateEntretiemposMetadata,
      title: "ENTRETIEMPOS - 6529.io",
      heading: /ENTRETIEMPOS/i,
    },
    {
      Component: IgnitionPage,
      generateMetadata: generateIgnitionMetadata,
      title: "IGNITION - 6529.io",
      heading: /IGNITION/i,
    },
    {
      Component: WatercolorDreamsPage,
      generateMetadata: generateWatercolorDreamsMetadata,
      title: "WATERCOLOR DREAMS - 6529.io",
      heading: /WATERCOLOR DREAMS/i,
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
});
