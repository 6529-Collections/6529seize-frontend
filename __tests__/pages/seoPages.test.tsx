import React from "react";
import { render, screen } from "@testing-library/react";
import LadysabrinaPage from "@/app/author/ladysabrina/page";
import DisneyDeekayPage from "@/app/blog/disney-deekay-their-secret-to-animation/page";
import EducationCollabPage from "@/app/education/education-collaboration-form/page";
import GMRedirectPage, {
  generateMetadata as generateGMMetadata,
} from "@/app/gm-or-die-small-mp4/page";
import CryptoAdzPage from "@/app/museum/6529-fund-szn1/cryptoadz/page";
import EntretiemposPage from "@/app/museum/6529-fund-szn1/entretiempos/page";
import JiometoryPage from "@/app/museum/6529-fund-szn1/jiometory-no-compute/page";
import ProtoglyphPage from "@/app/museum/6529-fund-szn1/proof-grails-protoglyph/page";
import WallPage from "@/app/museum/6529-fund-szn1/proof-grails-wall/page";
import KeyTrialPage from "@/app/museum/6529-fund-szn1/the-key-the-trial/page";
import { redirect } from "next/navigation";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

const redirectMock = redirect as jest.MockedFunction<typeof redirect>;

const getTitle = () => document.querySelector("title")?.textContent;
const getCanonical = () =>
  document.querySelector('link[rel="canonical"]')?.getAttribute("href");

describe("static SEO pages render correctly", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("author page renders with canonical link", () => {
    render(<LadysabrinaPage />);
    expect(getTitle()).toBe("Sabrina Khan, Author at 6529.io");
    expect(getCanonical()).toBe("/author/ladysabrina/");
    expect(screen.getAllByText(/Sabrina Khan/i).length).toBeGreaterThan(0);
  });

  it("blog page renders expected metadata", () => {
    render(<DisneyDeekayPage />);
    expect(getTitle()).toBe(
      "Disney and DeeKay: Their Secret to Animation - 6529.io"
    );
    expect(getCanonical()).toBe(
      "/blog/disney-deekay-their-secret-to-animation/"
    );
    expect(
      screen.getAllByText(/Disney and DeeKay: Their Secret to Animation/i)
        .length
    ).toBeGreaterThan(0);
  });

  it("education collaboration form page renders", () => {
    render(<EducationCollabPage />);
    expect(getTitle()).toBe("EDUCATION COLLABORATION FORM");
    expect(getCanonical()).toBe("/education/education-collaboration-form/");
    expect(
      screen.getAllByText(/EDUCATION COLLABORATION FORM/i).length
    ).toBeGreaterThan(0);
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

  it("cryptoadz museum page renders", () => {
    render(<CryptoAdzPage />);
    expect(getTitle()).toBe("CRYPTOADZ - 6529.io");
    expect(getCanonical()).toBe("/museum/6529-fund-szn1/cryptoadz/");
    expect(screen.getAllByText(/CRYPTOADZ/i).length).toBeGreaterThan(0);
  });

  it("entretiempos museum page renders", () => {
    render(<EntretiemposPage />);
    expect(getTitle()).toBe("ENTRETIEMPOS - 6529.io");
    expect(getCanonical()).toBe("/museum/6529-fund-szn1/entretiempos/");
    expect(screen.getAllByText(/ENTRETIEMPOS/i).length).toBeGreaterThan(0);
  });

  it("jiometory no compute museum page renders", () => {
    render(<JiometoryPage />);
    expect(getTitle()).toBe("JIOMETORY NO COMPUTE - 6529.io");
    expect(getCanonical()).toBe("/museum/6529-fund-szn1/jiometory-no-compute/");
    expect(screen.getAllByText(/JIOMETORY NO COMPUTE/i).length).toBeGreaterThan(
      0
    );
  });

  it("proof grails protoglyph page renders", () => {
    render(<ProtoglyphPage />);
    expect(getTitle()).toBe("PROOF GRAILS - PROTOGLYPH - 6529.io");
    expect(getCanonical()).toBe(
      "/museum/6529-fund-szn1/proof-grails-protoglyph/"
    );
    expect(screen.getAllByText(/PROTOGLYPH/i).length).toBeGreaterThan(0);
  });

  it("proof grails wall page renders", () => {
    render(<WallPage />);
    expect(getTitle()).toBe("PROOF GRAILS - WALL - 6529.io");
    expect(getCanonical()).toBe("/museum/6529-fund-szn1/proof-grails-wall/");
    expect(screen.getAllByText(/WALL/i).length).toBeGreaterThan(0);
  });

  it("the key the trial page renders", () => {
    render(<KeyTrialPage />);
    expect(getTitle()).toBe("THE KEY - THE TRIAL - 6529.io");
    expect(getCanonical()).toBe("/museum/6529-fund-szn1/the-key-the-trial/");
    expect(screen.getAllByText(/THE KEY/i).length).toBeGreaterThan(0);
  });
});
