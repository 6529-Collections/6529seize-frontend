import { render, screen } from "@testing-library/react";
import React from "react";
import AnIncomparableLove from "@/app/museum/6529-fund-szn1/an-incomparable-love/page";
import BoredApeYachtClub from "@/app/museum/6529-fund-szn1/bored-ape-yacht-club/page";
import IntensifyModeling from "@/app/museum/6529-fund-szn1/intensify-modeling/page";
import PrimaryColorsOfNeuralBricolage from "@/app/museum/6529-fund-szn1/primary-colors-of-neural-bricolage/page";
import Videodrome from "@/app/museum/6529-fund-szn1/videodrome/page";
import XCopy from "@/app/museum/6529-fund-szn1/xcopy/page";
import BatsoupyumMuseum1 from "@/app/museum/batsoupyum-museum-1/page";
import Autoglyphs from "@/app/museum/genesis/autoglyphs/page";
import ConstructionToken from "@/app/museum/genesis/construction-token/page";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);

describe("additional museum pages render", () => {
  it("renders An Incomparable Love page", () => {
    render(<AnIncomparableLove />);
    expect(screen.getAllByText(/AN INCOMPARABLE LOVE/i).length).toBeGreaterThan(
      0
    );
  });

  it("renders Bored Ape Yacht Club page", () => {
    render(<BoredApeYachtClub />);
    expect(screen.getAllByText(/BORED APE YACHT CLUB/i).length).toBeGreaterThan(
      0
    );
  });

  it("renders Intensify Modeling page", () => {
    render(<IntensifyModeling />);
    expect(screen.getAllByText(/INTENSIFY MODELING/i).length).toBeGreaterThan(
      0
    );
  });

  it("renders Primary Colors of Neural Bricolage page", () => {
    render(<PrimaryColorsOfNeuralBricolage />);
    expect(
      screen.getAllByText(/PRIMARY COLORS OF NEURAL BRICOLAGE/i).length
    ).toBeGreaterThan(0);
  });

  it("renders Videodrome page", () => {
    render(<Videodrome />);
    expect(screen.getAllByText(/VIDEODROME/i).length).toBeGreaterThan(0);
  });

  it("renders XCopy page", () => {
    render(<XCopy />);
    expect(screen.getAllByText(/XCOPY/i).length).toBeGreaterThan(0);
  });

  it("renders Batsoupyum Museum page", () => {
    render(<BatsoupyumMuseum1 />);
    expect(screen.getAllByText(/BATSOUPCAVE/i).length).toBeGreaterThan(0);
  });

  it("renders Autoglyphs page", () => {
    render(<Autoglyphs />);
    expect(screen.getAllByText(/AUTOGLYPHS/i).length).toBeGreaterThan(0);
  });

  it("renders Construction Token page", () => {
    render(<ConstructionToken />);
    expect(screen.getAllByText(/CONSTRUCTION TOKEN/i).length).toBeGreaterThan(
      0
    );
  });
});
