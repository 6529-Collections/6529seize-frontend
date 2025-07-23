import { render, screen } from "@testing-library/react";
import React from "react";
import Inspirals from "@/app/museum/genesis/inspirals/page";
import Unigrids from "@/app/museum/genesis/unigrids/page";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);

describe("museum genesis pages render", () => {
  it("renders Inspirals page", () => {
    render(<Inspirals />);
    expect(screen.getAllByText(/INSPIRALS/i).length).toBeGreaterThan(0);
  });

  it("renders Unigrids page", () => {
    render(<Unigrids />);
    expect(screen.getAllByText(/UNIGRIDS/i).length).toBeGreaterThan(0);
  });
});
