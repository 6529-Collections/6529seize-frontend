import { render, screen } from "@testing-library/react";
import React from "react";
import Azuki from "@/app/museum/6529-fund-szn1/azuki/page";
import Cod from "@/app/museum/6529-fund-szn1/cod/page";
import InvisibleFriends from "@/app/museum/6529-fund-szn1/invisible-friends/page";
import Nouns from "@/app/museum/6529-fund-szn1/nouns/page";
import ScreensPage from "@/app/museum/6529-fund-szn1/screens/page";
import TwinFlames from "@/app/museum/6529-fund-szn1/twin-flames/page";
import PhotoA from "@/app/museum/6529-photo-a/page";
import Batsoupyum from "@/app/museum/batsoupyum-museum-2/page";
import MemeLabId from "../../pages/meme-lab/[id]";
import BharatKrymo from "@/app/museum/bharat-krymo-museum-1/page";
import GenerativeArt from "@/app/museum/generative-art/page";
import SevenTwenty from "@/app/museum/genesis/720-minutes/page";
import Bent from "@/app/museum/genesis/bent/page";
import Elementals from "@/app/museum/genesis/elementals/page";
import GreatHall from "@/app/museum/genesis/great-hall-of-generative-art/page";
import JiometoryNoCompute from "@/app/museum/genesis/jiometory-no-compute/page";
import ParaBellum from "@/app/museum/genesis/para-bellum/page";
import ScribbledBoundaries from "@/app/museum/genesis/scribbled-boundaries/page";
import Spectron from "@/app/museum/genesis/spectron/page";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);

describe("additional museum and memelab pages render", () => {
  it("renders Azuki page", () => {
    render(<Azuki />);
    expect(screen.getAllByText(/AZUKI/i).length).toBeGreaterThan(0);
  });

  it("renders COD page", () => {
    render(<Cod />);
    expect(screen.getAllByText(/COD/i).length).toBeGreaterThan(0);
  });

  it("renders Invisible Friends page", () => {
    render(<InvisibleFriends />);
    expect(screen.getAllByText(/INVISIBLE FRIENDS/i).length).toBeGreaterThan(0);
  });

  it("renders Nouns page", () => {
    render(<Nouns />);
    expect(screen.getAllByText(/NOUNS/i).length).toBeGreaterThan(0);
  });

  it("renders Screens page", () => {
    render(<ScreensPage />);
    expect(screen.getAllByText(/SCREENS/i).length).toBeGreaterThan(0);
  });

  it("renders Twin Flames page", () => {
    render(<TwinFlames />);
    expect(screen.getAllByText(/TWIN FLAMES/i).length).toBeGreaterThan(0);
  });

  it("renders 6529 Photo A page", () => {
    render(<PhotoA />);
    expect(screen.getAllByText(/6529 PHOTO A/i).length).toBeGreaterThan(0);
  });

  it("renders Batsoupyum Museum page", () => {
    render(<Batsoupyum />);
    expect(screen.getAllByText(/BATSOUP/i).length).toBeGreaterThan(0);
  });

  it("renders Meme Lab page", () => {
    render(<MemeLabId />);
    expect(screen.getByTestId("dynamic")).toBeInTheDocument();
  });

  it("renders Bharat Krymo museum page", () => {
    render(<BharatKrymo />);
    expect(
      screen.getAllByText(/BHARAT KRYMO MUSEE D'ART 1/i).length
    ).toBeGreaterThan(0);
  });

  it("renders Generative Art page", () => {
    render(<GenerativeArt />);
    expect(screen.getAllByText(/GENERATIVE ART/i).length).toBeGreaterThan(0);
  });

  it("renders 720 Minutes page", () => {
    render(<SevenTwenty />);
    expect(screen.getAllByText(/720 MINUTES/i).length).toBeGreaterThan(0);
  });

  it("renders Bent page", () => {
    render(<Bent />);
    expect(screen.getAllByText(/BENT/i).length).toBeGreaterThan(0);
  });

  it("renders Elementals page", () => {
    render(<Elementals />);
    expect(screen.getAllByText(/ELEMENTALS/i).length).toBeGreaterThan(0);
  });

  it("renders Great Hall page", () => {
    render(<GreatHall />);
    expect(
      screen.getAllByText(/GREAT HALL OF GENERATIVE ART/i).length
    ).toBeGreaterThan(0);
  });

  it("renders Jiometory No Compute page", () => {
    render(<JiometoryNoCompute />);
    expect(screen.getAllByText(/JIOMETORY NO COMPUTE/i).length).toBeGreaterThan(
      0
    );
  });

  it("renders Para Bellum page", () => {
    render(<ParaBellum />);
    expect(screen.getAllByText(/PARA BELLUM/i).length).toBeGreaterThan(0);
  });

  it("renders Scribbled Boundaries page", () => {
    render(<ScribbledBoundaries />);
    expect(screen.getAllByText(/SCRIBBLED BOUNDARIES/i).length).toBeGreaterThan(
      0
    );
  });

  it("renders Spectron page", () => {
    render(<Spectron />);
    expect(screen.getAllByText(/SPECTRON/i).length).toBeGreaterThan(0);
  });
});
