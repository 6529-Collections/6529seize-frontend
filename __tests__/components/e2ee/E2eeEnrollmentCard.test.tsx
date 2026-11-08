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
jest.mock("@/hooks/device-signing/useSignedMessagesWallet", () => ({
  useSignedMessagesWallet: () => ({
    isRemoteWallet: false,
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
      await screen.findByRole("button", { name: "Enable Encrypted DMs" })
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
    const PARTIAL =
      "Signed posts are on. Encrypted DMs could not finish setup. You can try enabling them separately.";

    const renderSetupCard = () => {
      const engine = createFakeE2eeEngine({ status: "needs-enrollment" });
      const onClose = jest.fn();
      mockTurnOn.mockImplementation(async () => {
        engine.update({ status: "enrolling" });
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
