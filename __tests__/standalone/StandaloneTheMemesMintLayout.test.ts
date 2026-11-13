const LAYOUT_MODULE =
  "../../standalone/standalone-memes-mint/src/app/layout";

jest.mock("@/components/providers/Providers", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/dynamic-head/DynamicHeadTitle", () => ({
  __esModule: true,
  default: () => null,
}));

type LayoutModule = {
  readonly metadata: { readonly robots?: unknown };
};

function loadLayoutMetadata(standaloneTestBuild: boolean | undefined) {
  const previousRuntime = process.env["PUBLIC_RUNTIME"];
  const runtime = {
    ...JSON.parse(previousRuntime ?? "{}"),
    STANDALONE_TEST_BUILD: standaloneTestBuild,
  };

  try {
    process.env["PUBLIC_RUNTIME"] = JSON.stringify(runtime);
    jest.resetModules();
    const layout = require(LAYOUT_MODULE) as LayoutModule;
    return layout.metadata;
  } finally {
    if (previousRuntime === undefined) {
      delete process.env["PUBLIC_RUNTIME"];
    } else {
      process.env["PUBLIC_RUNTIME"] = previousRuntime;
    }
  }
}

describe("standalone mint layout robots policy", () => {
  it("marks test exports noindex, nofollow", () => {
    expect(loadLayoutMetadata(true).robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it.each([[false], [undefined]])(
    "leaves production exports without a robots directive (flag: %s)",
    (flag) => {
      expect(loadLayoutMetadata(flag).robots).toBeUndefined();
    }
  );
});
