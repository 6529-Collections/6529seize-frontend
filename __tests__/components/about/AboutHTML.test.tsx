import React from "react";
import { render, screen } from "@testing-library/react";
import AboutHTML from "@/components/about/AboutHTML";

jest.mock("@/components/about/about.helpers", () => ({
  fetchAboutSectionFile: jest.fn(() =>
    Promise.resolve('<div data-testid="content">HTML Content</div>')
  ),
}));

describe("AboutHTML", () => {
  it("splits title when containing spaces", async () => {
    render(<AboutHTML title="Test Title" path="test.html" />);
    const light = await screen.findByText("Test");
    expect(light).toHaveClass("font-lightest");
    expect(
      screen.getByRole("heading", { name: /Test Title/ })
    ).toBeInTheDocument();
  });

  it("renders title without split", async () => {
    render(<AboutHTML title="Single" path="test.html" />);
    expect(
      await screen.findByRole("heading", { name: "Single" })
    ).toBeInTheDocument();
  });

  it("renders fetched html", async () => {
    render(<AboutHTML title="Title" path="test.html" />);
    expect(await screen.findByTestId("content")).toBeInTheDocument();
  });
});
