import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import WaveRepRatingModal from "@/components/waves/header/rep/WaveRepRatingModal";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveRepAllocation } from "@/hooks/useWaveRepAllocation";
import { commonApiPost } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <span data-testid="circle-loader" />,
}));

jest.mock("@/hooks/useWaveRepAllocation", () => ({
  useWaveRepAllocation: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

const useWaveRepAllocationMock = useWaveRepAllocation as jest.Mock;
const commonApiPostMock = commonApiPost as jest.Mock;

const wave = {
  id: "wave-1",
  name: "Wave One",
  wave_rep: {
    total_rep: 10,
    categories: [{ category: "quality" }],
  },
} as ApiWave;

const allocationFor = (category: string | null) => ({
  currentRating: category === "quality" ? 10 : 2,
  availableWaveRep: 100,
  minMaxValues: { min: -110, max: 110 },
  isLoading: false,
});

function installDialogMocks() {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
}

function renderModal({
  onClose = jest.fn(),
  requestAuth = jest.fn().mockResolvedValue({ success: true }),
  setToast = jest.fn(),
}: {
  readonly onClose?: jest.Mock;
  readonly requestAuth?: jest.Mock;
  readonly setToast?: jest.Mock;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={
          {
            activeProfileProxy: null,
            connectedProfile: { handle: "tester" },
            connectionStatus: "CONNECTED",
            fetchingProfile: false,
            receivedProfileProxies: [],
            requestAuth,
            setActiveProfileProxy: jest.fn(),
            setToast,
            showWaves: true,
          } as any
        }
      >
        <WaveRepRatingModal wave={wave} onClose={onClose} />
      </AuthContext.Provider>
    </QueryClientProvider>
  );

  return {
    invalidateQueriesSpy,
    onClose,
    requestAuth,
    setToast,
  };
}

async function changeAmount(value: string) {
  const amountInput = await screen.findByLabelText(
    "Your total Wave REP for this category"
  );
  fireEvent.change(amountInput, { target: { value } });
  return amountInput;
}

describe("WaveRepRatingModal", () => {
  beforeAll(() => {
    installDialogMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    commonApiPostMock.mockResolvedValue(undefined);
    useWaveRepAllocationMock.mockImplementation(
      ({ category }: { readonly category: string | null }) =>
        allocationFor(category)
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not overwrite an edited amount while the category text is settling", async () => {
    jest.useFakeTimers();
    renderModal();
    const amountInput = await changeAmount("15");

    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "alpha" },
    });

    expect(amountInput).toHaveValue("15");

    act(() => {
      jest.advanceTimersByTime(349);
    });
    expect(amountInput).toHaveValue("15");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    await waitFor(() => expect(amountInput).toHaveValue("2"));
  });

  it("does not post when authentication is rejected", async () => {
    const requestAuth = jest.fn().mockResolvedValue({ success: false });
    const { setToast } = renderModal({ requestAuth });
    await changeAmount("15");

    fireEvent.click(screen.getByRole("button", { name: "Save Wave REP" }));

    await waitFor(() =>
      expect(setToast).toHaveBeenCalledWith({
        message: "Log in to continue.",
        type: "error",
      })
    );
    expect(commonApiPostMock).not.toHaveBeenCalled();
  });

  it("shows one mutation error toast and clears the busy state", async () => {
    commonApiPostMock.mockRejectedValue(new Error("failed"));
    const { setToast } = renderModal();
    await changeAmount("15");

    const saveButton = screen.getByRole("button", { name: "Save Wave REP" });
    fireEvent.click(saveButton);

    await waitFor(() => expect(setToast).toHaveBeenCalledTimes(1));
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Couldn't update Wave REP.",
        type: "error",
      })
    );
    await waitFor(() =>
      expect(saveButton).toHaveAttribute("aria-busy", "false")
    );
  });

  it("posts the rating and invalidates Wave REP allocation queries", async () => {
    const { invalidateQueriesSpy, onClose } = renderModal();
    await changeAmount("15");

    fireEvent.click(screen.getByRole("button", { name: "Save Wave REP" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(commonApiPostMock).toHaveBeenCalledWith({
      body: {
        amount: 15,
        category: "quality",
      },
      endpoint: "waves/wave-1/rep/rating",
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE_REP_RATING],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE_REP_CREDIT],
    });
  });
});
