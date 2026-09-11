import { render, screen } from "@testing-library/react";
import LadysabrinaPage, {
  generateMetadata as generateLadysabrinaMetadata,
} from "@/app/author/ladysabrina/page";
import DisneyDeekayPage, {
  generateMetadata as generateDisneyDeekayMetadata,
} from "@/app/blog/disney-deekay-their-secret-to-animation/page";
import EducationCollabPage, {
  generateMetadata as generateEducationCollabMetadata,
} from "@/app/education/education-collaboration-form/page";
import GMRedirectPage, {
  generateMetadata as generateGMMetadata,
} from "@/app/gm-or-die-small-mp4/page";
import CryptoAdzPage, {
  generateMetadata as generateCryptoAdzMetadata,
} from "@/app/museum/6529-fund-szn1/cryptoadz/page";
import EntretiemposPage, {
  generateMetadata as generateEntretiemposMetadata,
} from "@/app/museum/6529-fund-szn1/entretiempos/page";
import JiometoryPage, {
  generateMetadata as generateJiometoryMetadata,
} from "@/app/museum/6529-fund-szn1/jiometory-no-compute/page";
import ProtoglyphPage, {
  generateMetadata as generateProtoglyphMetadata,
} from "@/app/museum/6529-fund-szn1/proof-grails-protoglyph/page";
import WallPage, {
  generateMetadata as generateWallMetadata,
} from "@/app/museum/6529-fund-szn1/proof-grails-wall/page";
import KeyTrialPage, {
  generateMetadata as generateKeyTrialMetadata,
} from "@/app/museum/6529-fund-szn1/the-key-the-trial/page";
import { redirect } from "next/navigation";
import { expectMigratedWordPressPageRenders } from "./migratedWordPressPageTestUtils";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

const redirectMock = redirect as jest.MockedFunction<typeof redirect>;

describe("static SEO pages render correctly", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("author page renders migrated metadata", () => {
    render(<LadysabrinaPage />);

    const metadata = generateLadysabrinaMetadata();
    expect(metadata.title).toBe("Sabrina Khan - 6529.io");
    expect(document.querySelector("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
    expect(screen.getAllByText(/Sabrina Khan/i).length).toBeGreaterThan(0);
  });

  it("blog page renders expected metadata", async () => {
    render(<DisneyDeekayPage />);
    // Migrated blog articles supply their title via generateMetadata.
    const metadata = await generateDisneyDeekayMetadata();
    expect(metadata.title).toBe(
      "Disney and DeeKay: Their Secret to Animation - 6529.io"
    );
    expect(
      screen.getAllByText(/Disney and DeeKay: Their Secret to Animation/i)
        .length
    ).toBeGreaterThan(0);
  });

  it("education collaboration form page renders", () => {
    render(<EducationCollabPage />);

    const metadata = generateEducationCollabMetadata();
    expect(metadata.title).toBe("EDUCATION COLLABORATION FORM - 6529.io");
    expect(document.querySelector("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
    expect(
      screen.getAllByText(/EDUCATION COLLABORATION FORM/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "support@6529.io" })
    ).toHaveAttribute("href", "mailto:support@6529.io");
  });

  it("gm or die redirect page triggers a video redirect", () => {
    GMRedirectPage();
    expect(redirectMock).toHaveBeenCalledWith(
      "https://videos.files.wordpress.com/Pr49XLee/gm-or-die-small.mp4"
    );
  });

  it("gm or die metadata exposes redirecting title", async () => {
    const metadata = await generateGMMetadata();
    expect(metadata.title).toBe("Redirecting...");
  });

  [
    {
      Component: CryptoAdzPage,
      generateMetadata: generateCryptoAdzMetadata,
      heading: /CRYPTOADZ/i,
      title: "CRYPTOADZ - 6529.io",
    },
    {
      Component: EntretiemposPage,
      generateMetadata: generateEntretiemposMetadata,
      heading: /ENTRETIEMPOS/i,
      title: "ENTRETIEMPOS - 6529.io",
    },
    {
      Component: JiometoryPage,
      generateMetadata: generateJiometoryMetadata,
      heading: /JIOMETORY NO COMPUTE/i,
      title: "JIOMETORY NO COMPUTE - 6529.io",
    },
    {
      Component: ProtoglyphPage,
      generateMetadata: generateProtoglyphMetadata,
      heading: /PROTOGLYPH/i,
      title: "PROOF GRAILS - PROTOGLYPH - 6529.io",
    },
    {
      Component: WallPage,
      generateMetadata: generateWallMetadata,
      heading: /WALL/i,
      title: "PROOF GRAILS - WALL - 6529.io",
    },
    {
      Component: KeyTrialPage,
      generateMetadata: generateKeyTrialMetadata,
      heading: /THE KEY/i,
      title: "THE KEY - THE TRIAL - 6529.io",
    },
  ].forEach(({ Component, generateMetadata, heading, title }) => {
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
