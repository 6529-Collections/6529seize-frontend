/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import AboutPage, { generateMetadata } from "@/app/about/[section]/page";
import { redirect, notFound } from "next/navigation";
import { AboutSection } from "@/enums";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

jest.mock("@/components/about/About", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="about-component" />),
}));

beforeAll(() => {
  process.env.BASE_ENDPOINT = "https://test.6529.io";
});

describe("AboutPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects old tos path", async () => {
    await AboutPage({
      params: Promise.resolve({ section: "tos" }),
    } as any);

    expect(redirect).toHaveBeenCalledWith("/about/terms-of-service");
  });

  it("calls notFound for invalid section", async () => {
    await AboutPage({
      params: Promise.resolve({ section: "bad-section" }),
    } as any);

    expect(notFound).toHaveBeenCalled();
  });

  it("renders About component for valid section", async () => {
    const props = {
      params: Promise.resolve({ section: AboutSection.MEMES }),
    };

    const element = await AboutPage(props as any);

    render(element);

    expect(await screen.findByTestId("about-component")).toBeInTheDocument();
  });
});

describe("generateMetadata", () => {
  it("returns TOS metadata for tos", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ section: "tos" }),
    } as any);

    expect(meta).toEqual({
      title: "Terms of Service",
      description: "About",
    });
  });

  it("returns default About metadata for unknown", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ section: "bad-section" }),
    } as any);

    expect(meta.title).toBe("About");
    expect(meta.description).toBe("About | 6529.io");
  });

  it("returns correct metadata for valid section", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ section: AboutSection.MEMES }),
    } as any);

    expect(meta.title).toContain("Memes");
    expect(meta.description).toBe("About | 6529.io");
  });
});
