import { render, screen } from "@testing-library/react";
import React from "react";
import OmGroups, { generateMetadata } from "@/app/om/om-groups/page";
import { omOmGroupsMigratedWordPressPage } from "@/app/om/om-groups/content";

describe("OM pages render", () => {
  it("renders OM Groups page", () => {
    render(<OmGroups />);
    expect(screen.getAllByText(/OM GROUPS/i).length).toBeGreaterThan(0);
  });

  it("renders OM Groups with content about building OM together", () => {
    render(<OmGroups />);
    expect(
      screen.getByText(/We are going to build OM together/i)
    ).toBeInTheDocument();
  });

  it("renders OM Groups with representative groups list", () => {
    render(<OmGroups />);
    expect(screen.getByText(/Representative groups:/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Experiences: Art, Fashion, Education, Entertainment, Personal, Work/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Communities: Art, PFP, Off-chain/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Governance & Social/i)).toBeInTheDocument();
    expect(screen.getByText(/Decentralized Tech Stack/i)).toBeInTheDocument();
    expect(screen.getByText(/Inclusion/i)).toBeInTheDocument();
    expect(screen.getByText(/Public Policy/i)).toBeInTheDocument();
  });

  it("marks the page with its auditable migration source", () => {
    render(<OmGroups />);

    expect(document.querySelector("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
  });

  it("exposes title and Open Graph metadata via generateMetadata", () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe("OM GROUPS - 6529.io");
    expect(metadata.openGraph).toMatchObject({
      siteName: "6529.io",
      title: "OM GROUPS - 6529.io",
    });
  });

  it("keeps the content module aligned with the page path", () => {
    expect(omOmGroupsMigratedWordPressPage.path).toBe("/om/om-groups");
    expect(omOmGroupsMigratedWordPressPage.source).toBe("migrated-wordpress");
  });
});
