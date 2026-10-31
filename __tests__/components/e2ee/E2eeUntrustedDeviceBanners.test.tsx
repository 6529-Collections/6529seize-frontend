import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { E2eeUntrustedDeviceBanners } from "@/components/e2ee/conversation/E2eeUntrustedDeviceBanners";
import { getNoticeText } from "@/components/e2ee/e2eeFormat";
import {
  ALICE_ID,
  conversation,
  createFakeE2eeEngine,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";

const WALLET = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
const SHORT = "0x7099…79C8";
const GHOST_KEY = `0x${"ab".repeat(32)}`;

describe("E2eeUntrustedDeviceBanners", () => {
  it("names the new wallet and adds the device on Add device", async () => {
    const engine = createFakeE2eeEngine();
    render(
      <E2eeUntrustedDeviceBanners
        engine={engine}
        selfProfileId={SELF_ID}
        conversation={conversation({
          untrustedDevices: [
            {
              profileId: ALICE_ID,
              deviceKey: GHOST_KEY,
              wallet: WALLET,
              reason: "new-wallet",
            },
          ],
        })}
      />
    );
    expect(
      screen.getByText(`alice has a device signed by a new wallet ${SHORT}.`)
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: `Add device signed by wallet ${SHORT}`,
      })
    );
    await waitFor(() =>
      expect(engine.trustDevice).toHaveBeenCalledWith(GHOST_KEY)
    );
    const ignore = screen.getByRole("button", {
      name: `Ignore device signed by wallet ${SHORT}`,
    });
    await waitFor(() => expect(ignore).toBeEnabled());
    fireEvent.click(ignore);
    await waitFor(() =>
      expect(engine.ignoreDevice).toHaveBeenCalledWith(GHOST_KEY)
    );
  });

  it("runs one decision at a time: a double click adds once and every action waits", async () => {
    const engine = createFakeE2eeEngine();
    let release: () => void = () => undefined;
    (engine.trustDevice as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );
    const OTHER_KEY = `0x${"cd".repeat(32)}`;
    const OTHER_WALLET = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc";
    render(
      <E2eeUntrustedDeviceBanners
        engine={engine}
        selfProfileId={SELF_ID}
        conversation={conversation({
          untrustedDevices: [
            {
              profileId: ALICE_ID,
              deviceKey: GHOST_KEY,
              wallet: WALLET,
              reason: "new-wallet",
            },
            {
              profileId: ALICE_ID,
              deviceKey: OTHER_KEY,
              wallet: OTHER_WALLET,
              reason: "new-wallet",
            },
          ],
        })}
      />
    );
    const add = screen.getByRole("button", {
      name: `Add device signed by wallet ${SHORT}`,
    });
    fireEvent.click(add);
    fireEvent.click(add);
    expect(engine.trustDevice).toHaveBeenCalledTimes(1);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
    fireEvent.click(
      screen.getByRole("button", {
        name: `Ignore device signed by wallet ${SHORT}`,
      })
    );
    expect(engine.ignoreDevice).not.toHaveBeenCalled();

    await act(async () => {
      release();
    });
    await waitFor(() => {
      for (const button of screen.getAllByRole("button")) {
        expect(button).toBeEnabled();
      }
    });
    expect(engine.trustDevice).toHaveBeenCalledTimes(1);
  });

  it("explains an unchecked contract-wallet signature on your own device", () => {
    render(
      <E2eeUntrustedDeviceBanners
        engine={createFakeE2eeEngine()}
        selfProfileId={SELF_ID}
        conversation={conversation({
          untrustedDevices: [
            {
              profileId: SELF_ID,
              deviceKey: GHOST_KEY,
              wallet: WALLET,
              reason: "unverified",
            },
          ],
        })}
      />
    );
    expect(
      screen.getByText(
        `You have a device signed by wallet ${SHORT}, and this device couldn’t check that signature.`
      )
    ).toBeInTheDocument();
  });

  it("renders nothing without untrusted devices", () => {
    const { container } = render(
      <E2eeUntrustedDeviceBanners
        engine={createFakeE2eeEngine()}
        selfProfileId={SELF_ID}
        conversation={conversation()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the signing wallet in the device-added notice", () => {
    const notice = message({
      id: "n",
      kind: "notice",
      senderProfileId: SELF_ID,
      notice: {
        type: "device_added",
        actorProfileId: SELF_ID,
        targetProfileIds: [ALICE_ID],
        detail: WALLET,
      },
    });
    expect(
      getNoticeText("en-US", notice, conversation().members, SELF_ID)
    ).toBe(`alice added a device signed by wallet ${SHORT}`);
  });
});
