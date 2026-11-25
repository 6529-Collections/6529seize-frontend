import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import {
  WaveEligibilityProvider,
  useWaveEligibility,
} from "@/contexts/wave/WaveEligibilityContext";
import { commonApiFetch } from "@/services/api/common-api";

let mockActorId = "profile-a";
jest.mock("@/components/auth/authContext", () => ({
  useAuth: () => ({
    connectedProfile: { id: mockActorId },
    activeProfileProxy: null,
    isAuthenticated: true,
    isDirectProfileSession: true,
  }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const WAVE_ID = "wave-1";
const ELIGIBLE = {
  authenticated_user_eligible_to_chat: true,
  authenticated_user_eligible_to_reply: true,
  authenticated_user_eligible_to_vote: false,
  authenticated_user_eligible_to_participate: true,
  authenticated_user_admin: false,
};

let api: ReturnType<typeof useWaveEligibility>;
let renders = 0;

function Consumer() {
  api = useWaveEligibility();
  renders += 1;
  const eligibility = api.getEligibility(WAVE_ID);
  return (
    <div data-testid="chat">
      {String(eligibility?.authenticated_user_eligible_to_chat ?? "unknown")}
    </div>
  );
}

function renderProvider() {
  return render(
    <WaveEligibilityProvider>
      <Consumer />
    </WaveEligibilityProvider>
  );
}

beforeEach(() => {
  mockActorId = "profile-a";
  renders = 0;
  jest.mocked(commonApiFetch).mockReset();
});

it("keeps state and consumers untouched when a feed page reports unchanged eligibility", () => {
  renderProvider();
  act(() => api.updateEligibility(WAVE_ID, ELIGIBLE));
  const rendersAfterFirstReport = renders;

  act(() => {
    api.updateEligibility(WAVE_ID, { ...ELIGIBLE });
    api.updateEligibility(WAVE_ID, {
      authenticated_user_eligible_to_chat: true,
    });
  });

  expect(renders).toBe(rendersAfterFirstReport);
  expect(screen.getByTestId("chat")).toHaveTextContent("true");
});

it("re-renders consumers when eligibility actually changes", () => {
  renderProvider();
  act(() => api.updateEligibility(WAVE_ID, ELIGIBLE));
  const rendersAfterFirstReport = renders;

  act(() =>
    api.updateEligibility(WAVE_ID, {
      authenticated_user_eligible_to_chat: false,
    })
  );

  expect(renders).toBeGreaterThan(rendersAfterFirstReport);
  expect(screen.getByTestId("chat")).toHaveTextContent("false");
});

it("treats an unchanged server report as fresh, so refresh skips the refetch", async () => {
  jest.useFakeTimers();
  try {
    renderProvider();
    act(() => api.updateEligibility(WAVE_ID, ELIGIBLE));

    // Four minutes later the feed re-reports the same values.
    act(() => jest.advanceTimersByTime(4 * 60 * 1000));
    act(() => api.updateEligibility(WAVE_ID, { ...ELIGIBLE }));

    // Two more minutes: six since the last change, two since confirmation.
    act(() => jest.advanceTimersByTime(2 * 60 * 1000));
    await act(() => api.refreshEligibility(WAVE_ID));

    expect(commonApiFetch).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});

it("refetches eligibility once the last confirmation is older than five minutes", async () => {
  jest.useFakeTimers();
  try {
    jest.mocked(commonApiFetch).mockResolvedValue({
      chat: { authenticated_user_eligible: false },
      voting: { authenticated_user_eligible: false },
      participation: { authenticated_user_eligible: false },
    });
    renderProvider();
    act(() => api.updateEligibility(WAVE_ID, ELIGIBLE));

    act(() => jest.advanceTimersByTime(5 * 60 * 1000 + 1));
    await act(() => api.refreshEligibility(WAVE_ID));

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `waves/${WAVE_ID}`,
    });
    expect(screen.getByTestId("chat")).toHaveTextContent("false");
  } finally {
    jest.useRealTimers();
  }
});

it("still refreshes a wave that has no confirmed eligibility yet", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue({
    chat: { authenticated_user_eligible: true },
    voting: { authenticated_user_eligible: true },
    participation: { authenticated_user_eligible: true },
  });
  function Refresher() {
    const { refreshEligibility } = useWaveEligibility();
    useEffect(() => {
      void refreshEligibility(WAVE_ID);
    }, [refreshEligibility]);
    return null;
  }
  render(
    <WaveEligibilityProvider>
      <Refresher />
      <Consumer />
    </WaveEligibilityProvider>
  );

  expect(await screen.findByText("true")).toBeInTheDocument();
  expect(commonApiFetch).toHaveBeenCalledTimes(1);
});

it("clears the previous actor's denial and ignores their held update", () => {
  const view = renderProvider();
  act(() =>
    api.updateEligibility(WAVE_ID, {
      ...ELIGIBLE,
      authenticated_user_eligible_to_chat: false,
    })
  );
  const previousUpdate = api.updateEligibility;
  mockActorId = "profile-b";
  view.rerender(
    <WaveEligibilityProvider>
      <Consumer />
    </WaveEligibilityProvider>
  );
  expect(screen.getByTestId("chat")).toHaveTextContent("unknown");
  act(() => previousUpdate(WAVE_ID, ELIGIBLE));
  expect(screen.getByTestId("chat")).toHaveTextContent("unknown");
  act(() => api.updateEligibility(WAVE_ID, ELIGIBLE));
  expect(screen.getByTestId("chat")).toHaveTextContent("true");
});

it("ignores a previous actor's delayed eligibility response", async () => {
  let finishPrevious: ((value: unknown) => void) | undefined;
  jest.mocked(commonApiFetch).mockImplementation(
    () =>
      new Promise((resolve) => {
        finishPrevious = resolve;
      })
  );
  const view = renderProvider();
  let pending: Promise<void> | undefined;
  act(() => {
    pending = api.refreshEligibility(WAVE_ID);
  });
  mockActorId = "profile-b";
  view.rerender(
    <WaveEligibilityProvider>
      <Consumer />
    </WaveEligibilityProvider>
  );
  act(() => api.updateEligibility(WAVE_ID, ELIGIBLE));
  await act(async () => {
    finishPrevious?.({
      chat: { authenticated_user_eligible: false },
      voting: { authenticated_user_eligible: false },
      participation: { authenticated_user_eligible: false },
    });
    await pending;
  });
  expect(screen.getByTestId("chat")).toHaveTextContent("true");
});
