/**
 * @jest-environment jsdom
 */

import AboutTechReportRoute, {
  generateMetadata,
  generateStaticParams,
} from "@/app/about/tech/[reportSlug]/page";
import {
  TECH_PR_REPORTS,
  TECH_WEEKLY_PR_REPORT,
} from "@/components/about/tech/reports";
import { getAppMetadata } from "@/components/providers/metadata";
import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

jest.mock("@/components/about/About", () => ({
  AboutMenu: () => <nav data-testid="about-menu" />,
}));

jest.mock("@/components/about/tech/TechReportPage", () => ({
  __esModule: true,
  default: ({ report }: { report: { slug: string } }) => (
    <div data-testid="tech-report-page">{report.slug}</div>
  ),
}));

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn((metadata) => metadata),
}));

describe("AboutTechReportRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a selected report by slug", async () => {
    const element = await AboutTechReportRoute({
      params: Promise.resolve({ reportSlug: TECH_WEEKLY_PR_REPORT.slug }),
    });

    render(element);

    expect(screen.getByTestId("tech-report-page")).toHaveTextContent(
      TECH_WEEKLY_PR_REPORT.slug
    );
  });

  it("calls notFound for an unknown report slug", async () => {
    await AboutTechReportRoute({
      params: Promise.resolve({ reportSlug: "missing-report" }),
    });

    expect(notFound).toHaveBeenCalled();
  });
});

describe("generateMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the selected report metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ reportSlug: TECH_WEEKLY_PR_REPORT.slug }),
    });

    expect(getAppMetadata).toHaveBeenCalledWith({
      title: TECH_WEEKLY_PR_REPORT.title,
      description: TECH_WEEKLY_PR_REPORT.description,
    });
    expect(metadata).toEqual({
      title: TECH_WEEKLY_PR_REPORT.title,
      description: TECH_WEEKLY_PR_REPORT.description,
    });
  });

  it("falls back to tech metadata for an unknown report slug", async () => {
    await generateMetadata({
      params: Promise.resolve({ reportSlug: "missing-report" }),
    });

    expect(getAppMetadata).toHaveBeenCalledWith({
      title: "Tech",
      description: "About",
    });
  });
});

describe("generateStaticParams", () => {
  it("publishes every tech report slug", () => {
    expect(generateStaticParams()).toEqual(
      TECH_PR_REPORTS.map((report) => ({ reportSlug: report.slug }))
    );
  });
});
