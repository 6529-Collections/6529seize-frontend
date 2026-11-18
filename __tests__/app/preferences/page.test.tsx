import PreferencesPage from "@/app/preferences/page";

let mockDevicesSecurityEnabled = true;
jest.mock(
  "@/components/preferences/devices-security/devicesSecurityFeature",
  () => ({
    isDevicesSecurityEnabled: () => mockDevicesSecurityEnabled,
  })
);
jest.mock("@/app/preferences/page.client", () => ({
  __esModule: true,
  default: () => null,
}));

const activeTabFor = async (tab: string | string[] | undefined) => {
  const element = await PreferencesPage({
    searchParams: Promise.resolve({ tab }),
  });
  return (element.props as { activeTab: string }).activeTab;
};

describe("/preferences tab parameter", () => {
  beforeEach(() => {
    mockDevicesSecurityEnabled = true;
  });

  it.each(["security", "devices"])(
    "opens Devices & security for tab=%s",
    async (tab) => {
      await expect(activeTabFor(tab)).resolves.toBe("security");
    }
  );

  it.each([
    ["a path-like value", "../security"],
    ["a different case", "SECURITY"],
    ["an empty value", ""],
    ["a repeated parameter", ["security", "reports"]],
    ["no parameter", undefined],
  ])("falls back to notifications for %s", async (_, tab) => {
    await expect(activeTabFor(tab)).resolves.toBe("notifications");
  });

  it("falls back to notifications while neither permission is enabled", async () => {
    mockDevicesSecurityEnabled = false;
    await expect(activeTabFor("security")).resolves.toBe("notifications");
  });
});
