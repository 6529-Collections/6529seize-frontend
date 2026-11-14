import { act, render, screen } from "@testing-library/react";
import DeviceSetupDialog from "@/components/device-signing/DeviceSetupDialog";
import DeviceSetupMenuAction from "@/components/device-signing/DeviceSetupMenuAction";
import { E2EE_MESSAGES } from "@/i18n/messages/e2ee";
import {
  contextFor,
  createFakeE2eeEngine,
  E2eeTestProvider,
} from "../e2ee/fakeE2eeEngine";

jest.mock("@/components/e2ee/gate/E2eeEnrollmentCard", () => ({
  E2eeEnrollmentCard: () => null,
}));
jest.mock("@/components/e2ee/gate/E2eeEnrollmentIdentity", () => ({
  E2eeEnrollmentIdentity: () => null,
}));
const mockSecurityState = jest.fn();
jest.mock("@/components/device-signing/DeviceSecurityStatus", () => ({
  useDeviceSecurityState: () => mockSecurityState(),
  DeviceSecurityDetails: () => null,
}));

const UPGRADE = E2EE_MESSAGES["e2ee.upgrade.title"];
const ENABLE_DMS = E2EE_MESSAGES["e2ee.deviceStatus.enableEncryption"];
const ENABLE_BOTH = E2EE_MESSAGES["e2ee.deviceStatus.enableBoth"];

const engineWith = (upgrade: { superseded: number } | null) =>
  createFakeE2eeEngine({ status: "needs-enrollment", upgrade });

describe("device setup dialog title during the D172 upgrade", () => {
  it("says Turn on encrypted DMs to a device that never enrolled", () => {
    const engine = engineWith(null);
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <DeviceSetupDialog scope="dms" onClose={jest.fn()} />
      </E2eeTestProvider>
    );
    expect(
      screen.getByRole("dialog", { name: ENABLE_DMS })
    ).toBeInTheDocument();
  });

  it("uses upgrade wording while the device moves off the earlier suite", () => {
    const engine = engineWith({ superseded: 2 });
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <DeviceSetupDialog scope="dms" onClose={jest.fn()} />
      </E2eeTestProvider>
    );
    expect(screen.getByRole("dialog", { name: UPGRADE })).toBeInTheDocument();

    act(() => engine.update({ upgrade: null }));

    expect(
      screen.getByRole("dialog", { name: ENABLE_DMS })
    ).toBeInTheDocument();
  });

  it("keeps the combined title when signing is also off", () => {
    const engine = engineWith({ superseded: 1 });
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <DeviceSetupDialog scope="both" onClose={jest.fn()} />
      </E2eeTestProvider>
    );
    expect(
      screen.getByRole("dialog", { name: ENABLE_BOTH })
    ).toBeInTheDocument();
  });
});

describe("device setup menu entry during the D172 upgrade", () => {
  beforeEach(() => {
    mockSecurityState.mockReturnValue({
      proof: "on",
      encrypted: "off",
      canEnableEncryption: true,
      proofRenewal: null,
      encryptionRenewal: null,
      proofGrant: null,
    });
  });

  it.each([
    [null, ENABLE_DMS],
    [{ superseded: 3 }, UPGRADE],
  ])("labels the entry for upgrade %p", (upgrade, label) => {
    render(
      <E2eeTestProvider value={contextFor(engineWith(upgrade))}>
        <DeviceSetupMenuAction onClose={jest.fn()} showStatus={false} />
      </E2eeTestProvider>
    );
    expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
  });
});
