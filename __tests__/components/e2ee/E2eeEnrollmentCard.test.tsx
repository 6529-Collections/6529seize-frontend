import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { SeizeConnectContext } from "@/components/auth/seizeConnectContextValue";
import type { SeizeConnectContextType } from "@/components/auth/seizeConnectTypes";
import type { turnOnWithCombinedSignIn } from "@/components/e2ee/gate/e2eeCombinedTurnOn";
import { E2eeEnrollmentCard } from "@/components/e2ee/gate/E2eeEnrollmentCard";
import { createFakeE2eeEngine } from "./fakeE2eeEngine";

type CombinedTurnOnOutcome = Awaited<
  ReturnType<typeof turnOnWithCombinedSignIn>
>;

const mockRequestGrant = jest.fn();
const mockConnect = jest.fn();
let mockCanSign = true;
let mockIsRemoteWallet = false;
jest.mock("@/hooks/device-signing/useSignedMessagesWallet", () => ({
  useSignedMessagesWallet: () => ({
    isRemoteWallet: mockIsRemoteWallet,
    networkName: "Ethereum",
    isNetworkSupported: () => true,
    switchNetwork: jest.fn(),
  }),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestSignedMessagesGrant: mockRequestGrant }),
}));

const mockTurnOn = jest.fn<Promise<CombinedTurnOnOutcome>, [unknown]>();
jest.mock("@/components/e2ee/gate/e2eeCombinedTurnOn", () => ({
  turnOnWithCombinedSignIn: (input: unknown) => mockTurnOn(input),
}));

const ADDRESS = "0x1111111111111111111111111111111111111111";
const BUTTON = { name: "Sign to enable both" };

const renderCard = () => {
  const engine = createFakeE2eeEngine({ status: "needs-enrollment" });
  const view = render(
    <SeizeConnectContext.Provider
      value={
        {
          address: ADDRESS,
          canSignActiveWallet: mockCanSign,
          connectedAccounts: [],
          seizeConnectFresh: mockConnect,
        } as unknown as SeizeConnectContextType
      }
    >
      <E2eeEnrollmentCard
        scope="both"
        engine={engine}
        enrolling={false}
        engineError={null}
      />
    </SeizeConnectContext.Provider>
  );
  return Object.assign(engine, {
    rerenderCard: () =>
      view.rerender(
        <SeizeConnectContext.Provider
          value={
            {
              address: ADDRESS,
              canSignActiveWallet: mockCanSign,
              connectedAccounts: [],
              seizeConnectFresh: mockConnect,
            } as unknown as SeizeConnectContextType
          }
        >
          <E2eeEnrollmentCard
            scope="both"
            engine={engine}
            enrolling={false}
            engineError={null}
          />
        </SeizeConnectContext.Provider>
      ),
  });
};

describe("E2eeEnrollmentCard turn-on", () => {
  beforeEach(() => {
    mockTurnOn.mockReset();
    mockCanSign = true;
    mockIsRemoteWallet = false;
    mockConnect.mockReset();
  });

  it("turns on with the combined sign-in and no separate grant prompt", async () => {
    mockTurnOn.mockResolvedValue("done");
    const engine = renderCard();

    fireEvent.click(screen.getByRole("button", BUTTON));

    await waitFor(() =>
      expect(mockTurnOn).toHaveBeenCalledWith({
        engine,
        address: ADDRESS,
        requestGrant: expect.any(Function),
        onRegistering: expect.any(Function),
      })
    );
    await waitFor(() =>
      expect(
        screen.queryByText("Check your wallet to sign")
      ).not.toBeInTheDocument()
    );
    expect(engine.enroll).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("announces the wait and marks the button busy during the combined sign-in", async () => {
    let finish: (outcome: CombinedTurnOnOutcome) => void = () => undefined;
    mockTurnOn.mockImplementation(async (input: unknown) => {
      (input as { requestGrant?: (options: object) => unknown }).requestGrant?.(
        {}
      );
      return await new Promise((resolve) => {
        finish = resolve;
      });
    });
    mockRequestGrant.mockImplementation((options) => {
      options?.onSignatureRequested?.();
      return Promise.resolve({ success: true });
    });
    renderCard();

    fireEvent.click(screen.getByRole("button", BUTTON));

    const status = await screen.findByText("Check your wallet to sign");
    expect(status.tagName).toBe("OUTPUT");
    const button = screen.getByRole("button", BUTTON);
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();

    finish("done");
    await waitFor(() =>
      expect(screen.getByRole("button", BUTTON)).not.toBeDisabled()
    );
  });

  it("requires a separate approval when combined setup is unavailable", async () => {
    mockTurnOn.mockResolvedValue("fallback");
    const engine = renderCard();

    fireEvent.click(screen.getByRole("button", BUTTON));

    fireEvent.click(
      await screen.findByRole("button", { name: "Turn on encrypted DMs" })
    );
    expect(engine.enroll).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Sign to enable Encrypted DMs" })
    );
    await waitFor(() => expect(engine.enroll).toHaveBeenCalledTimes(1));
  });

  it("says nothing was turned on when the signature is cancelled", async () => {
    mockTurnOn.mockResolvedValue("declined");
    const engine = renderCard();

    fireEvent.click(screen.getByRole("button", BUTTON));

    const declined = await screen.findByText("Signature cancelled.");
    expect(declined.tagName).toBe("OUTPUT");
    expect(engine.enroll).not.toHaveBeenCalled();
  });

  it("asks nothing more when the wallet changed mid-way", async () => {
    mockTurnOn.mockResolvedValue("stopped");
    const engine = renderCard();

    fireEvent.click(screen.getByRole("button", BUTTON));

    await waitFor(() => expect(mockTurnOn).toHaveBeenCalled());
    expect(engine.enroll).not.toHaveBeenCalled();
  });

  describe("when encryption is still registering after the sign-in", () => {
    const FINISHING =
      "Signed posts are on. Encrypted DMs are still finishing setup in this browser and will turn on by themselves. You can close this window.";
    const FINISHING_INLINE =
      "Signed posts are on. Encrypted DMs are still finishing setup in this browser and will turn on by themselves.";
    const PARTIAL =
      "Signed posts are on. Encrypted DMs could not finish setup. You can try enabling them separately.";

    const renderSetupCard = (
      statusAtPending: "enrolling" | "ready" = "enrolling"
    ) => {
      const engine = createFakeE2eeEngine({ status: "needs-enrollment" });
      const onClose = jest.fn();
      mockTurnOn.mockImplementation(async () => {
        engine.update({ status: statusAtPending });
        return "pending";
      });
      render(
        <SeizeConnectContext.Provider
          value={
            {
              address: ADDRESS,
              canSignActiveWallet: true,
              connectedAccounts: [],
              seizeConnectFresh: mockConnect,
            } as unknown as SeizeConnectContextType
          }
        >
          <E2eeEnrollmentCard
            scope="both"
            engine={engine}
            enrolling={false}
            engineError={null}
            onClose={onClose}
          />
        </SeizeConnectContext.Provider>
      );
      fireEvent.click(screen.getByRole("button", BUTTON));
      return { engine, onClose };
    };

    it("says it is still finishing, without an alert, and closes once it is on", async () => {
      const { engine, onClose } = renderSetupCard();

      const notice = await screen.findByText(FINISHING);
      expect(notice.tagName).toBe("OUTPUT");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();

      act(() => engine.update({ status: "ready" }));
      expect(onClose).toHaveBeenCalled();
    });

    it("closes exactly once on repeated notifications and ignores later changes", async () => {
      const { engine, onClose } = renderSetupCard();
      await screen.findByText(FINISHING);

      act(() => {
        engine.update({ status: "ready" });
        engine.update({ status: "ready" });
      });
      act(() => engine.update({ status: "needs-enrollment" }));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(FINISHING)).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("closes once when encryption settles before the sign-in flow finishes", async () => {
      // Registration ended right at the wait's limit: the watch settles at
      // once, and the flow's own success callback must not close again.
      const { onClose } = renderSetupCard("ready");

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      // The sign-in flow has finished (and called onEnabled) by now.
      await waitFor(() =>
        expect(screen.getByRole("button", BUTTON)).toHaveAttribute(
          "aria-busy",
          "false"
        )
      );
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(FINISHING)).not.toBeInTheDocument();
    });

    it("replaces the wallet prompts once signed, with no Reconnect during the wait", async () => {
      jest.useFakeTimers();
      try {
        mockIsRemoteWallet = true;
        mockRequestGrant.mockImplementation(
          async (options?: { onSignatureRequested?: () => void }) => {
            options?.onSignatureRequested?.();
            return { success: true };
          }
        );
        const engine = createFakeE2eeEngine({ status: "needs-enrollment" });
        let finishRegistration: () => void = () => undefined;
        mockTurnOn.mockImplementation(async (input: unknown) => {
          const turnOn = input as {
            requestGrant: (options: object) => Promise<unknown>;
            onRegistering: () => void;
          };
          await turnOn.requestGrant({ silent: true, encryptedMessages: true });
          engine.update({ status: "enrolling" });
          turnOn.onRegistering();
          await new Promise<void>((resolve) => {
            finishRegistration = resolve;
          });
          return "done";
        });
        render(
          <SeizeConnectContext.Provider
            value={
              {
                address: ADDRESS,
                canSignActiveWallet: true,
                connectedAccounts: [],
                seizeConnectFresh: mockConnect,
              } as unknown as SeizeConnectContextType
            }
          >
            <E2eeEnrollmentCard
              scope="both"
              engine={engine}
              enrolling={false}
              engineError={null}
            />
          </SeizeConnectContext.Provider>
        );
        fireEvent.click(screen.getByRole("button", BUTTON));
        await act(async () => {
          await Promise.resolve();
        });
        expect(screen.getByText(FINISHING_INLINE)).toBeInTheDocument();

        // Past the slow-wallet hint (8 s) and the WalletConnect stall (20 s).
        act(() => {
          jest.advanceTimersByTime(21_000);
        });
        expect(screen.getByText(FINISHING_INLINE)).toBeInTheDocument();
        expect(screen.queryByText(/your wallet|your phone/iu)).toBeNull();
        expect(
          screen.queryByRole("button", { name: "Reconnect wallet" })
        ).toBeNull();

        await act(async () => {
          finishRegistration();
          await Promise.resolve();
        });
        expect(screen.queryByText(FINISHING_INLINE)).toBeNull();
      } finally {
        mockRequestGrant.mockReset();
        jest.useRealTimers();
      }
    });

    it("explains a partial setup only if the registration then fails", async () => {
      const { engine, onClose } = renderSetupCard();
      await screen.findByText(FINISHING);

      act(() => engine.update({ status: "needs-enrollment" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(PARTIAL);
      expect(screen.queryByText(FINISHING)).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it("reports a failure as an alert", async () => {
    mockTurnOn.mockRejectedValue(new Error("storage"));
    renderCard();

    fireEvent.click(screen.getByRole("button", BUTTON));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn’t turn on encrypted messages. Try again."
    );
  });

  it("connects a disconnected wallet before attempting encrypted enrollment and resumes automatically", async () => {
    mockCanSign = false;
    mockTurnOn.mockResolvedValue("done");
    const engine = renderCard();
    fireEvent.click(screen.getByRole("button", BUTTON));
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockTurnOn).not.toHaveBeenCalled();
    expect(screen.queryByText("Signature cancelled.")).not.toBeInTheDocument();
    mockCanSign = true;
    engine.rerenderCard();
    await waitFor(() => expect(mockTurnOn).toHaveBeenCalledTimes(1));
    expect(engine.enroll).not.toHaveBeenCalled();
  });
});

describe("E2eeEnrollmentCard upgrade copy (D172)", () => {
  const renderScoped = (
    scope: "dms" | "both",
    upgrade: { superseded: number } | null
  ) => {
    const engine = createFakeE2eeEngine({
      status: "needs-enrollment",
      upgrade,
    });
    render(
      <SeizeConnectContext.Provider
        value={
          {
            address: ADDRESS,
            canSignActiveWallet: true,
            connectedAccounts: [],
            seizeConnectFresh: mockConnect,
          } as unknown as SeizeConnectContextType
        }
      >
        <E2eeEnrollmentCard
          scope={scope}
          engine={engine}
          enrolling={false}
          engineError={null}
        />
      </SeizeConnectContext.Provider>
    );
    return engine;
  };

  beforeEach(() => {
    mockTurnOn.mockReset();
    mockCanSign = true;
  });

  it("shows first-time copy to a device that never enrolled", () => {
    renderScoped("dms", null);

    expect(
      screen.getByRole("heading", { name: "Turn on encrypted DMs" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Encrypted chats can be read only by the people in them."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/moving to stronger encryption/u)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign to enable Encrypted DMs" })
    ).toBeEnabled();
  });

  it("shows upgrade copy and asks for one signature through enroll()", async () => {
    const engine = renderScoped("dms", { superseded: 3 });

    expect(
      screen.getByRole("heading", { name: "Upgrade encrypted messages" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Encrypted messages are moving to stronger encryption. Confirm once in your wallet to continue; your messages stay on this device."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your 3 existing conversations stay readable. Open one to continue it with the new encryption."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Encrypted chats can be read only by the people in them."
      )
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Sign to upgrade Encrypted DMs" })
    );

    await waitFor(() => expect(engine.enroll).toHaveBeenCalledTimes(1));
    expect(mockTurnOn).not.toHaveBeenCalled();
  });

  it("keeps the combined sign-in when signing is also off", async () => {
    mockTurnOn.mockResolvedValue("done");
    const engine = renderScoped("both", { superseded: 1 });

    expect(
      screen.getByText(/moving to stronger encryption/u)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your 1 existing conversation stays readable. Open it to continue it with the new encryption."
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", BUTTON));

    await waitFor(() => expect(mockTurnOn).toHaveBeenCalledTimes(1));
    expect(engine.enroll).not.toHaveBeenCalled();
  });

  it("keeps the combined copy and omits the kept count when nothing was kept", async () => {
    mockTurnOn.mockResolvedValue("done");
    const engine = renderScoped("both", { superseded: 0 });

    expect(
      screen.getByRole("heading", { name: "Turn on signed posts and encrypted DMs" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/moving to stronger encryption/u)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/existing conversation/u)
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", BUTTON));

    await waitFor(() => expect(mockTurnOn).toHaveBeenCalledTimes(1));
    expect(engine.enroll).not.toHaveBeenCalled();
  });

  it("follows the engine when the upgrade clears", () => {
    const engine = renderScoped("dms", { superseded: 0 });
    expect(
      screen.getByRole("heading", { name: "Upgrade encrypted messages" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/existing conversation/u)
    ).not.toBeInTheDocument();

    act(() => engine.update({ upgrade: null }));

    expect(
      screen.getByRole("heading", { name: "Turn on encrypted DMs" })
    ).toBeInTheDocument();
  });

  it("reports a failed upgrade with upgrade wording", async () => {
    const engine = renderScoped("dms", { superseded: 2 });
    jest.mocked(engine.enroll).mockRejectedValueOnce(new Error("storage"));

    fireEvent.click(
      screen.getByRole("button", { name: "Sign to upgrade Encrypted DMs" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn’t upgrade encrypted messages. Try again."
    );
  });
});
