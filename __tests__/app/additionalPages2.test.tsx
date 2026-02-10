// @ts-nocheck
import { render, screen } from "@testing-library/react";
import React from "react";
import Teexels from "@/app/author/teexels/page";
import Capital from "@/app/capital/page";
import Feed from "@/app/feed/page";
import { redirect } from "next/navigation";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

const redirectMock = redirect as jest.MockedFunction<typeof redirect>;

describe("additional static pages 2", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("renders Teexels author page", () => {
    render(<Teexels />);
    expect(screen.getAllByText(/Teexels/i).length).toBeGreaterThan(0);
  });

  it("renders Capital page", () => {
    render(<Capital />);
    expect(screen.getAllByText(/6529 CAPITAL/i).length).toBeGreaterThan(0);
  });

  it("redirects Feed page to index.xml", () => {
    render(<Feed />);
    expect(redirectMock).toHaveBeenCalledWith("/index.xml");
  });
});
