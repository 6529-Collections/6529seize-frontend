import { act, fireEvent, render, screen } from "@testing-library/react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MuseumLiveGeneratorEncounter } from "@/components/museum/MuseumLiveGeneratorEncounter";
import type { MuseumMedia } from "@/lib/museum/publication/types";

const liveMedia: MuseumMedia = {
  id: "6529NM-MED-VERA-210-LIVE",
  artworkId: "6529NM-W-VERA-210",
  kind: "live",
  role: "source",
  mediaType: "text/html",
  width: null,
  height: null,
  altText: "Official live generator.",
  credit: {
    creditLine: "Vera Molnár, in collaboration with Martin Grasser.",
    licenseLabel: "CC BY-NC 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
    rightsExpressionId: "cc-by-nc-4.0",
    sourcePath: "records/entities/6529NM-MED-VERA-210-LIVE.json",
  },
  sourcePath: "records/entities/6529NM-MED-VERA-210-LIVE.json",
  custody: "upstream",
  url: "https://generator.artblocks.io/1/0xe034bb2b1b9471e11cf1a0a9199a156fb227aa5d/210",
  preservationStatus: "not_retained",
  sha256: null,
  upstreamProvider: "art_blocks",
};

describe("MuseumLiveGeneratorEncounter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("does not load the generator until the visitor asks for it", () => {
    render(<MuseumLiveGeneratorEncounter media={liveMedia} title="#210" />);

    expect(document.querySelector("iframe")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: t(DEFAULT_LOCALE, "museum.network.artworkViewer.viewLive"),
      })
    );

    const frame = document.querySelector("iframe");
    expect(frame).toHaveAttribute("src", liveMedia.url);
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    expect(frame).not.toHaveAttribute("allow-same-origin");
    expect(frame).toHaveAttribute(
      "title",
      t(DEFAULT_LOCALE, "museum.network.artworkViewer.liveTitle", {
        title: "#210",
      })
    );
  });

  it("offers recovery after twelve seconds without trusting iframe load", () => {
    render(<MuseumLiveGeneratorEncounter media={liveMedia} title="#210" />);
    fireEvent.click(
      screen.getByRole("button", {
        name: t(DEFAULT_LOCALE, "museum.network.artworkViewer.viewLive"),
      })
    );
    fireEvent.load(document.querySelector("iframe")!);

    act(() => jest.advanceTimersByTime(11_999));
    expect(
      screen.getByRole("button", {
        name: t(DEFAULT_LOCALE, "museum.network.artworkViewer.returnToStill"),
      })
    ).toBeVisible();

    act(() => jest.advanceTimersByTime(1));
    expect(
      screen.getByRole("button", {
        name: t(DEFAULT_LOCALE, "museum.network.artworkViewer.liveRecovery"),
      })
    ).toBeVisible();
  });

  it("does not render when the source record has no live affordance", () => {
    const { container } = render(
      <MuseumLiveGeneratorEncounter media={undefined} title="#210" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("uses the canonical Work credit with one complete linked license", () => {
    render(
      <MuseumLiveGeneratorEncounter
        media={liveMedia}
        title="#210"
        creditLine="Vera Molnár, in collaboration with Martin Grasser, Themes and Variations #210, 2023."
      />
    );

    expect(
      screen.getByText(
        /Vera Molnár, in collaboration with Martin Grasser, Themes and Variations #210, 2023\./u
      )
    ).toBeVisible();
    const licenseLink = screen.getByRole("link", { name: "CC BY-NC 4.0" });
    expect(licenseLink).toBeVisible();
    expect(licenseLink).toHaveAttribute("href", liveMedia.credit.licenseUrl);
    expect(
      screen.queryByText(/Live generator source/u)
    ).not.toBeInTheDocument();
  });
});
