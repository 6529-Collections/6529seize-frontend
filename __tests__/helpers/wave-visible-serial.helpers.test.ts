import {
  captureVisibleWaveDropSerial,
  preserveWaveScrollPositionForReload,
  WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE,
  WAVE_SERIAL_QUERY_PARAM,
} from "@/helpers/waves/wave-visible-serial.helpers";

interface RowSpec {
  readonly id: string;
  readonly top: number;
  readonly bottom: number;
}

interface ContainerSpec {
  readonly top?: number;
  readonly height?: number;
  readonly width?: number;
  readonly scrollTop?: number;
  readonly scrollHeight?: number;
  readonly rows?: readonly RowSpec[];
}

const CONTAINER_HEIGHT = 600;

function buildContainer({
  top = 0,
  height = CONTAINER_HEIGHT,
  width = 800,
  scrollTop = -500, // column-reverse: negative = scrolled up from the bottom
  scrollHeight = 5000,
  rows = [],
}: ContainerSpec): HTMLDivElement {
  const container = document.createElement("div");
  container.setAttribute(WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE, "true");
  container.style.flexDirection = "column-reverse";
  Object.defineProperties(container, {
    clientHeight: { configurable: true, value: height },
    clientWidth: { configurable: true, value: width },
    scrollHeight: { configurable: true, value: scrollHeight },
    scrollTop: { configurable: true, value: scrollTop, writable: true },
  });
  container.getBoundingClientRect = () =>
    ({
      top,
      bottom: top + height,
      height,
      width,
      left: 0,
      right: width,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;

  for (const row of rows) {
    const el = document.createElement("div");
    el.id = row.id;
    el.getBoundingClientRect = () =>
      ({
        top: row.top,
        bottom: row.bottom,
        height: row.bottom - row.top,
        width,
        left: 0,
        right: width,
        x: 0,
        y: row.top,
        toJSON: () => ({}),
      }) as DOMRect;
    container.appendChild(el);
  }

  document.body.appendChild(container);
  return container;
}

describe("captureVisibleWaveDropSerial", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns null when no wave scroll container is on the page", () => {
    expect(captureVisibleWaveDropSerial()).toBeNull();
  });

  it("returns null when the reader is at the bottom (live mode)", () => {
    buildContainer({
      scrollTop: 0,
      rows: [{ id: "drop-100", top: 250, bottom: 350 }],
    });
    expect(captureVisibleWaveDropSerial()).toBeNull();
  });

  it("returns the serial of the row nearest the container center", () => {
    buildContainer({
      rows: [
        { id: "drop-10", top: -80, bottom: 20 }, // barely visible at top
        { id: "drop-11", top: 20, bottom: 240 },
        { id: "drop-12", top: 240, bottom: 380 }, // spans center (300)
        { id: "drop-13", top: 380, bottom: 700 },
        { id: "drop-14", top: 700, bottom: 900 }, // fully below the fold
      ],
    });
    expect(captureVisibleWaveDropSerial()).toBe(12);
  });

  it("ignores elements whose id suffix is not a plain serial", () => {
    buildContainer({
      rows: [
        { id: "drop-abc", top: 250, bottom: 350 },
        { id: "drop-", top: 260, bottom: 340 },
        { id: "drop-42", top: 0, bottom: 120 },
      ],
    });
    expect(captureVisibleWaveDropSerial()).toBe(42);
  });

  it("prefers the largest visible container when several are mounted", () => {
    buildContainer({
      width: 300,
      rows: [{ id: "drop-1", top: 250, bottom: 350 }],
    });
    buildContainer({
      width: 900,
      rows: [{ id: "drop-2", top: 250, bottom: 350 }],
    });
    expect(captureVisibleWaveDropSerial()).toBe(2);
  });

  it("treats a plain-column container's max scroll as the bottom", () => {
    const container = buildContainer({
      scrollTop: 4400, // scrollHeight 5000 - clientHeight 600 => at bottom
      rows: [{ id: "drop-7", top: 250, bottom: 350 }],
    });
    container.style.flexDirection = "column";
    expect(captureVisibleWaveDropSerial()).toBeNull();
  });
});

describe("preserveWaveScrollPositionForReload", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/waves/wave-1");
  });

  it("pins the captured serial into the URL", () => {
    buildContainer({
      rows: [{ id: "drop-321", top: 250, bottom: 350 }],
    });

    preserveWaveScrollPositionForReload();

    const url = new URL(window.location.href);
    expect(url.searchParams.get(WAVE_SERIAL_QUERY_PARAM)).toBe("321");
  });

  it("leaves the URL untouched when there is nothing to preserve", () => {
    window.history.replaceState(null, "", "/waves/wave-1?foo=bar");

    preserveWaveScrollPositionForReload();

    const url = new URL(window.location.href);
    expect(url.searchParams.has(WAVE_SERIAL_QUERY_PARAM)).toBe(false);
    expect(url.searchParams.get("foo")).toBe("bar");
  });
});
