import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SeizeConnectContext } from "@/components/auth/seizeConnectContextValue";
import type { SeizeConnectContextType } from "@/components/auth/seizeConnectTypes";
import type { turnOnWithCombinedSignIn } from "@/components/e2ee/gate/e2eeCombinedTurnOn";
import { E2eeEnrollmentCard } from "@/components/e2ee/gate/E2eeEnrollmentCard";
import { createFakeE2eeEngine } from "./fakeE2eeEngine";

type CombinedTurnOnOutcome = Awaited<
  ReturnType<typeof turnOnWithCombinedSignIn>
>;

const mockRequestGrant = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestSignedMessagesGrant: mockRequestGrant }),
}));

const mockTurnOn = jest.fn<Promise<CombinedTurnOnOutcome>, [unknown]>();
jest.mock("@/components/e2ee/gate/e2eeCombinedTurnOn", () => ({
  turnOnWithCombinedSignIn: (input: unknown) => mockTurnOn(input),
}));

const ADDRESS = "0x1111111111111111111111111111111111111111";
const BUTTON = { name: "Turn on encrypted messages (one signature)" };

const renderCard = () => {
  const engine = createFakeE2eeEngine({ status: "needs-enrollment" });
  render(
    <SeizeConnectContext.Provider
      value={{ address: ADDRESS } as unknown as SeizeConnectContextType}
    >
      <E2eeEnrollmentCard
        engine={engine}
        enrolling={false}
        engineError={null}
      />
    </SeizeConnectContext.Provider>
  );
  return engine;
};

describe("E2eeEnrollmentCard turn-on", () => {
  beforeEach(() => {
    mockTurnOn.mockReset();
  });

  it("turns on with the combined sign-in and no separate grant prompt", async () => {
    mockTurnOn.mockResolvedValue("done");
    const engine = renderCard();

    fireEvent.click(screen.getByRole("button", BUTTON));

    await waitFor(() =>
      expect(mockTurnOn).toHaveBeenCalledWith({
        engine,
        address: ADDRESS,
        requestGrant: mockRequestGrant,
      })
    );
    await waitFor(() =>
      expect(
        screen.queryByText("Waiting for your wallet signature…")
      ).not.toBeInTheDocument()
    );
    expect(engine.enroll).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("announces the wait and marks the button busy during the combined sign-in", async () => {
    let finish: (outcome: CombinedTurnOnOutcome) => void = () => undefined;
    mockTurnOn.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    renderCard();

    fireEvent.click(screen.getByRole("button", BUTTON));

    const status = await screen.findByText(
      "Waiting for your wallet signature…"
    );
    expect(status.tagName).toBe("OUTPUT");
    const button = screen.getByRole("button", BUTTON);
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();

    finish("done");
    await waitFor(() =>
      expect(screen.getByRole("button", BUTTON)).not.toBeDisabled()
    );
  });

  it("uses the separate grant prompt when the combined sign-in is not possible", async () => {
    mockTurnOn.mockResolvedValue("fallback");
    const engine = renderCard();

    fireEvent.click(screen.getByRole("button", BUTTON));

    await waitFor(() => expect(engine.enroll).toHaveBeenCalledTimes(1));
  });

  it("says nothing was turned on when the signature is cancelled", async () => {
    mockTurnOn.mockResolvedValue("declined");
    const engine = renderCard();

    fireEvent.click(screen.getByRole("button", BUTTON));

    const declined = await screen.findByText(
      "You cancelled the signature. Nothing was turned on."
    );
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

  it("reports a failure as an alert", async () => {
    mockTurnOn.mockRejectedValue(new Error("storage"));
    renderCard();

    fireEvent.click(screen.getByRole("button", BUTTON));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn’t turn on encrypted messages. Try again."
    );
  });
});
