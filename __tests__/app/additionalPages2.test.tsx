// @ts-nocheck
import { render, screen } from "@testing-library/react";
import React from "react";
import Teexels from "@/app/author/teexels/page";
import Capital from "@/app/capital/page";
import Feed from "@/app/feed/page";
import { notFound, redirect } from "next/navigation";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  notFound: jest.fn(() => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  }),
}));

const redirectMock = redirect as jest.MockedFunction<typeof redirect>;
const notFoundMock = notFound as jest.MockedFunction<typeof notFound>;

describe("additional static pages 2", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    notFoundMock.mockClear();
  });

  it("renders Teexels author page", () => {
    render(<Teexels />);
    expect(screen.getAllByText(/Teexels/i).length).toBeGreaterThan(0);
  });

  it("renders Capital page", () => {
    render(<Capital />);
    expect(screen.getAllByText(/6529 CAPITAL/i).length).toBeGreaterThan(0);
  });

  it("answers the retired Feed address with not-found instead of redirecting", () => {
    expect(() => Feed()).toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
