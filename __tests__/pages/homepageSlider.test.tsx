import { render } from "@testing-library/react";
import React from "react";
import HomeSlider from "@/app/slide-page/homepage-slider/page";
import { redirect } from "next/navigation";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

const redirectMock = redirect as jest.MockedFunction<typeof redirect>;

describe("homepage slider redirect", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("redirects to the homepage", () => {
    render(<HomeSlider />);
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
