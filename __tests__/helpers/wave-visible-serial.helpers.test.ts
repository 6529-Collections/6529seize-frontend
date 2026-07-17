import {
  captureVisibleWaveDropSerial,
  DROP_SERIAL_ATTRIBUTE,
  preserveWaveScrollPositionForReload,
  WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE,
  WAVE_SERIAL_QUERY_PARAM,
} from "@/helpers/waves/wave-visible-serial.helpers";

interface RowSpec {
  readonly serial: string;
  readonly top: number;
  readonly bottom: number;
}

interface ContainerSpec {
  readonly top?: number;
  readonly height?: number;
  readonly width?: number;
  readonly scrollTop?: number;
  readonly rows?: readonly RowSpec[];
}

const CONTAINER_HEIGHT = 600;

function buildContainer({
  top = 0,
  height = CONTAINER_HEIGHT,
  width = 800,
  scrollTop = -500, // column-reverse: negative = scrolled up from the bottom
  rows = [],
}: ContainerSpec): HTMLDivElement {
  const container = document.createElement("div");
  container.setAttribute(WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE, "true");
  Object.defineProperties(container, {
    clientHeight: { configurable: true, value: height },
    clientWidth: { configurable: true, value: width },
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
    el.setAttribute(DROP_SERIAL_ATTRIBUTE, row.serial);
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
      rows: [{ serial: "100", top: 250, bottom: 350 }],
    });
    expect(captureVisibleWaveDropSerial()).toBeNull();
  });

  it("returns null within the at-bottom epsilon", () => {
    buildContainer({
      scrollTop: -40,
      rows: [{ serial: "100", top: 250, bottom: 350 }],
    });
    expect(captureVisibleWaveDropSerial()).toBeNull();
  });

  it("returns the serial of the row nearest the container center", () => {
    buildContainer({
      rows: [
        { serial: "10", top: -80, bottom: 20 }, // barely visible at top
        { serial: "11", top: 20, bottom: 240 },
        { serial: "12", top: 240, bottom: 380 }, // spans center (300)
        { serial: "13", top: 380, bottom: 700 },
        { serial: "14", top: 700, bottom: 900 }, // fully below the fold
      ],
    });
    expect(captureVisibleWaveDropSerial()).toBe(12);
  });

  it("picks the farther valid row when the nearest row's serial is malformed", () => {
    buildContainer({
      rows: [
        { serial: "not-a-serial", top: 250, bottom: 350 }, // dead-center
        { serial: "", top: 260, bottom: 340 },
        { serial: "42", top: 0, bottom: 120 }, // farther but valid
      ],
    });
    expect(captureVisibleWaveDropSerial()).toBe(42);
  });

  it("prefers the largest visible container when several are mounted", () => {
    buildContainer({
      width: 300,
      rows: [{ serial: "1", top: 250, bottom: 350 }],
    });
    buildContainer({
      width: 900,
      rows: [{ serial: "2", top: 250, bottom: 350 }],
    });
    expect(captureVisibleWaveDropSerial()).toBe(2);
  });

  it("prefers the outer container when a smaller one is nested inside it", () => {
    const outer = buildContainer({
      width: 900,
      rows: [{ serial: "7", top: 250, bottom: 350 }],
    });
    const nested = buildContainer({
      width: 200,
      height: 200,
      rows: [{ serial: "8", top: 250, bottom: 350 }],
    });
    outer.appendChild(nested);
    expect(captureVisibleWaveDropSerial()).toBe(7);
  });

  it("ignores rows fully outside the container viewport", () => {
    buildContainer({
      rows: [
        { serial: "5", top: -300, bottom: -10 },
        { serial: "6", top: 610, bottom: 800 },
      ],
    });
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
      rows: [{ serial: "321", top: 250, bottom: 350 }],
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

  it("never throws when the DOM misbehaves", () => {
    const container = buildContainer({
      rows: [{ serial: "9", top: 250, bottom: 350 }],
    });
    container.getBoundingClientRect = () => {
      throw new Error("detached");
    };

    expect(() => preserveWaveScrollPositionForReload()).not.toThrow();
    const url = new URL(window.location.href);
    expect(url.searchParams.has(WAVE_SERIAL_QUERY_PARAM)).toBe(false);
  });
});
