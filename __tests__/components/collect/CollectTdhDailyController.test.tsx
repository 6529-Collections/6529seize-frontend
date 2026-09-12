import CollectTdhDailyController from "@/components/collect/CollectTdhDailyController";
import type {
  CollectTdhDailyEstimate,
  CollectTdhDailyInput,
} from "@/components/collect/collect-tdh-daily.types";
import { act, fireEvent, render, screen } from "@testing-library/react";

const result = (
  payload: string,
  dailyTdh = "175",
  purchaseEth = "0.009"
): CollectTdhDailyEstimate<string> => ({ payload, dailyTdh, purchaseEth });
const renderResult = (payload: string) => (
  <button type="button">Review {payload}</button>
);
const target = () => screen.getByLabelText("Base TDH per day");
const budget = () => screen.getByLabelText("Purchase budget (ETH)");
const tick = async () => {
  await act(async () => {
    jest.advanceTimersByTime(350);
  });
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it("invalidates a captured result action immediately on edit and unmount", async () => {
  const guards: Array<() => void> = [];
  const action = jest.fn();
  const { unmount } = render(
    <CollectTdhDailyController
      contextKey="one"
      calculate={async () => result("one")}
      onConnect={jest.fn()}
      renderResult={(_payload, guardAction) => {
        guards.push(guardAction(action));
        return <span>Result</span>;
      }}
    />
  );
  fireEvent.change(target(), { target: { value: "1" } });
  await tick();
  const old = guards.at(-1)!;
  old();
  expect(action).toHaveBeenCalledTimes(1);
  fireEvent.change(target(), { target: { value: "2" } });
  old();
  expect(action).toHaveBeenCalledTimes(1);
  await tick();
  old();
  expect(action).toHaveBeenCalledTimes(1);
  const latest = guards.at(-1)!;
  latest();
  expect(action).toHaveBeenCalledTimes(2);
  unmount();
  latest();
  expect(action).toHaveBeenCalledTimes(2);
});

it("recalculates the same driving input without reactivating any previous review handler", async () => {
  const callbacks: Array<() => void> = [];
  const action = jest.fn(),
    calculate = jest.fn(async () => result("same"));
  render(
    <CollectTdhDailyController
      contextKey="one"
      calculate={calculate}
      onConnect={jest.fn()}
      renderResult={(_payload, guardAction) => {
        callbacks.push(guardAction(action));
        return <span>Result</span>;
      }}
    />
  );
  fireEvent.change(budget(), { target: { value: "0.0100" } });
  await tick();
  const old = callbacks.at(-1)!;
  fireEvent.click(screen.getByRole("button", { name: "Recalculate" }));
  old();
  expect(action).not.toHaveBeenCalled();
  expect(budget()).toHaveValue("0.0100");
  await tick();
  old();
  expect(action).not.toHaveBeenCalled();
  expect(calculate).toHaveBeenCalledTimes(2);
  expect(calculate).toHaveBeenLastCalledWith(
    { mode: "budget", value: "0.0100" },
    expect.any(AbortSignal)
  );
  callbacks.at(-1)!();
  expect(action).toHaveBeenCalledTimes(1);
});

it("keeps browsing idle and debounces edits without a derived-field request loop", async () => {
  const calculate = jest.fn(
    async (_input: CollectTdhDailyInput, _signal: AbortSignal) => result("one")
  );
  render(
    <CollectTdhDailyController
      contextKey="profile:a:memes"
      calculate={calculate}
      onConnect={jest.fn()}
      renderResult={renderResult}
    />
  );
  await tick();
  expect(calculate).not.toHaveBeenCalled();
  fireEvent.change(target(), { target: { value: "1" } });
  fireEvent.change(target(), { target: { value: "150" } });
  expect(calculate).not.toHaveBeenCalled();
  await tick();
  expect(calculate).toHaveBeenCalledTimes(1);
  expect(calculate).toHaveBeenCalledWith(
    { mode: "daily_tdh", value: "150" },
    expect.any(AbortSignal)
  );
  expect(target()).toHaveValue("150");
  expect(budget()).toHaveValue("0.009");
  expect(
    screen.getByText("Selected NFTs earn 175 base TDH per day.")
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Review one" })).toBeVisible();
  await tick();
  expect(calculate).toHaveBeenCalledTimes(1);
});

it("allows the calculated field to become the driving budget, preserving its cap and reporting actual cost", async () => {
  const calculate = jest.fn(async () => result("budget"));
  render(
    <CollectTdhDailyController
      contextKey="profile:a:memes"
      calculate={calculate}
      onConnect={jest.fn()}
      renderResult={renderResult}
    />
  );
  fireEvent.change(target(), { target: { value: "150" } });
  await tick();
  fireEvent.change(budget(), { target: { value: "0.0100" } });
  expect(
    screen.queryByRole("button", { name: "Review budget" })
  ).not.toBeInTheDocument();
  expect(target()).toHaveValue("");
  await tick();
  expect(calculate).toHaveBeenLastCalledWith(
    { mode: "budget", value: "0.0100" },
    expect.any(AbortSignal)
  );
  expect(budget()).toHaveValue("0.0100");
  expect(target()).toHaveValue("175");
  expect(screen.getByText("Current listing cost: 0.009 ETH.")).toBeVisible();
});

it("aborts stale analysis and never exposes its review after a newer edit", async () => {
  let resolveOld:
    | ((value: CollectTdhDailyEstimate<string>) => void)
    | undefined;
  let oldSignal: AbortSignal | undefined;
  const calculate = jest.fn(
    (input: CollectTdhDailyInput, signal: AbortSignal) => {
      if (input.value === "100") {
        oldSignal = signal;
        return new Promise<CollectTdhDailyEstimate<string>>((resolve) => {
          resolveOld = resolve;
        });
      }
      return Promise.resolve(result("new", "250", "0.02"));
    }
  );
  render(
    <CollectTdhDailyController
      contextKey="profile:a:memes"
      calculate={calculate}
      onConnect={jest.fn()}
      renderResult={renderResult}
    />
  );
  fireEvent.change(target(), { target: { value: "100" } });
  await tick();
  fireEvent.change(target(), { target: { value: "250" } });
  expect(oldSignal?.aborted).toBe(true);
  await tick();
  await act(async () => {
    resolveOld?.(result("stale"));
  });
  expect(screen.getByRole("button", { name: "Review new" })).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Review stale" })
  ).not.toBeInTheDocument();
  expect(target()).toHaveValue("250");
  expect(budget()).toHaveValue("0.02");
});

it("resets the result and aborts work when profile, recipient or family context changes", async () => {
  let resolvePending:
    | ((value: CollectTdhDailyEstimate<string>) => void)
    | undefined;
  let signal: AbortSignal | undefined;
  const calculate = jest.fn(
    (_input: CollectTdhDailyInput, nextSignal: AbortSignal) => {
      signal = nextSignal;
      return new Promise<CollectTdhDailyEstimate<string>>((resolve) => {
        resolvePending = resolve;
      });
    }
  );
  const props = { calculate, onConnect: jest.fn(), renderResult };
  const { rerender } = render(
    <CollectTdhDailyController
      contextKey="profile:a:recipient:a:memes"
      {...props}
    />
  );
  fireEvent.change(budget(), { target: { value: "1" } });
  await tick();
  rerender(
    <CollectTdhDailyController
      contextKey="profile:b:recipient:b:gradients"
      {...props}
    />
  );
  expect(signal?.aborted).toBe(true);
  expect(target()).toHaveValue("");
  expect(budget()).toHaveValue("");
  await act(async () => {
    resolvePending?.(result("old profile"));
  });
  expect(
    screen.queryByRole("button", { name: "Review old profile" })
  ).not.toBeInTheDocument();
});

it("keeps invalid input local and never connects or calculates without an explicit profile action", async () => {
  const onConnect = jest.fn();
  const calculate = jest.fn(async () => result("one"));
  const { rerender } = render(
    <CollectTdhDailyController
      contextKey="guest"
      calculate={calculate}
      onConnect={onConnect}
      renderResult={renderResult}
    />
  );
  fireEvent.change(target(), { target: { value: "1.234" } });
  await tick();
  expect(target()).toHaveAttribute("aria-invalid", "true");
  expect(calculate).not.toHaveBeenCalled();
  rerender(
    <CollectTdhDailyController
      contextKey="guest"
      calculate={null}
      onConnect={onConnect}
      renderResult={renderResult}
    />
  );
  fireEvent.change(target(), { target: { value: "100" } });
  await tick();
  expect(onConnect).not.toHaveBeenCalled();
  expect(calculate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Connect profile" }));
  expect(onConnect).toHaveBeenCalledTimes(1);
});

it("sanitizes errors and only retries after a deliberate retry action", async () => {
  const calculate = jest
    .fn<
      Promise<CollectTdhDailyEstimate<string>>,
      [CollectTdhDailyInput, AbortSignal]
    >()
    .mockRejectedValueOnce(new Error("private provider detail"))
    .mockResolvedValueOnce(result("retried"));
  render(
    <CollectTdhDailyController
      contextKey="profile:a:memes"
      calculate={calculate}
      onConnect={jest.fn()}
      renderResult={renderResult}
    />
  );
  fireEvent.change(budget(), { target: { value: "1" } });
  await tick();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "This estimate could not be calculated."
  );
  expect(screen.queryByText(/private provider detail/)).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Review/ })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await tick();
  expect(screen.getByRole("button", { name: "Review retried" })).toBeVisible();
});
