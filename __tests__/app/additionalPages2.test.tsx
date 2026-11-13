// @ts-nocheck
import { render, screen } from "@testing-library/react";
import React from "react";
import Teexels from "@/app/author/teexels/page";
import Capital from "@/app/capital/page";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);

describe("additional static pages 2", () => {
  it("renders Teexels author page", () => {
    render(<Teexels />);
    expect(screen.getAllByText(/Teexels/i).length).toBeGreaterThan(0);
  });

  it("renders Capital page", () => {
    render(<Capital />);
    expect(screen.getAllByText(/6529 CAPITAL/i).length).toBeGreaterThan(0);
  });
});
