import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveProposalCardSettings from "@/components/waves/specs/WaveProposalCardSettings";
import { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveConfig } from "@/generated/models/ApiWaveConfig";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { useWave } from "@/hooks/useWave";
import { useWaveMetadata } from "@/hooks/waves/useWaveMetadata";
import { replaceWaveMetadata } from "@/services/api/wave-metadata-replacement";

const mockRequestAuth = jest.fn();
const mockSetToast = jest.fn();
const mockInvalidate = jest.fn();

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: mockRequestAuth, setToast: mockSetToast }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { WAVE_METADATA: "WAVE_METADATA" },
}));
jest.mock("@/helpers/waves/waves.helpers", () => ({ canEditWave: jest.fn() }));
jest.mock("@/hooks/useWave", () => ({ useWave: jest.fn() }));
jest.mock("@/hooks/waves/useWaveMetadata", () => ({
  useWaveMetadata: jest.fn(),
}));
jest.mock("@/services/api/wave-metadata-replacement", () => ({
  replaceWaveMetadata: jest.fn(),
}));

const wave = Object.assign(new ApiWave(), {
  id: "standard-wave",
  wave: Object.assign(new ApiWaveConfig(), { type: ApiWaveType.Rank }),
});
const setMetadata = (data: ApiWaveMetadata[] = [], state = {}) => {
  (useWaveMetadata as jest.Mock).mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    ...state,
  });
};
const edit = () =>
  screen.getByRole("button", { name: "Edit proposal card settings" });
const save = () => screen.getByRole("button", { name: "Save" });
const summary = () => screen.getByRole("radio", { name: "Summary card" });
const full = () => screen.getByRole("radio", { name: "Full proposal" });
const limit = () =>
  screen.getByRole("spinbutton", { name: /Text preview limit/ });

describe("WaveProposalCardSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMetadata();
    (canEditWave as jest.Mock).mockReturnValue(true);
    (useWave as jest.Mock).mockReturnValue({});
    mockRequestAuth.mockResolvedValue({ success: true });
    mockInvalidate.mockResolvedValue(undefined);
    jest.mocked(replaceWaveMetadata).mockResolvedValue(undefined);
  });

  it("keeps the saved value when a draft is cancelled, dismissed, or reopened", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <WaveProposalCardSettings wave={wave} display="configuration" />
    );
    await user.click(edit());
    expect(full()).toBeChecked();
    expect(save()).toBeDisabled();
    await user.click(summary());
    expect(limit()).toHaveValue(360);
    expect(save()).toBeEnabled();
    expect(within(container).getByText("Full proposal")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(edit());
    expect(full()).toBeChecked();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    await user.click(summary());
    await user.keyboard("{Escape}");
    await user.click(edit());
    expect(full()).toBeChecked();
    expect(replaceWaveMetadata).not.toHaveBeenCalled();
  });

  it.each(["119", "1001", "120.5", ""])(
    "rejects the invalid summary limit %s",
    async (value) => {
      const user = userEvent.setup();
      render(<WaveProposalCardSettings wave={wave} />);
      await user.click(edit());
      await user.click(summary());
      fireEvent.change(limit(), { target: { value } });
      expect(limit()).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("alert")).toHaveTextContent("120");
      expect(save()).toBeDisabled();
      await user.click(full());
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    }
  );

  it.each([120, 1000])(
    "saves summary settings at the %s boundary and reads the saved value",
    async (value) => {
      const user = userEvent.setup();
      const view = render(<WaveProposalCardSettings wave={wave} />);
      await user.click(edit());
      await user.click(summary());
      fireEvent.change(limit(), { target: { value: String(value) } });
      await user.click(
        screen.getByRole("checkbox", { name: "Image on summary card" })
      );
      await user.click(save());
      await waitFor(() =>
        expect(edit()).toHaveAttribute("aria-expanded", "false")
      );
      const body = {
        data_key: "wave_display.proposals.card_recipe",
        data_value: JSON.stringify({
          version: 1,
          layout: "summary",
          excerpt_max_characters: value,
          show_media_thumbnail: false,
        }),
      };
      expect(replaceWaveMetadata).toHaveBeenCalledWith(
        expect.objectContaining({ waveId: wave.id, create: [body] })
      );
      setMetadata([{ id: 1, ...body }]);
      view.rerender(<WaveProposalCardSettings wave={wave} />);
      expect(screen.getByText("Summary card")).toBeVisible();
      await user.click(edit());
      expect(summary()).toBeChecked();
      expect(limit()).toHaveValue(value);
      expect(screen.getByRole("checkbox")).not.toBeChecked();
      expect(save()).toBeDisabled();
    }
  );

  it("keeps the draft through authentication and API failures, then allows retry", async () => {
    const user = userEvent.setup();
    mockRequestAuth.mockResolvedValueOnce({ success: false });
    jest
      .mocked(replaceWaveMetadata)
      .mockRejectedValueOnce(new Error("API unavailable"));
    render(<WaveProposalCardSettings wave={wave} />);
    await user.click(edit());
    await user.click(summary());
    await user.click(save());
    await waitFor(() => expect(save()).toBeEnabled());
    expect(screen.getByRole("alert")).toBeVisible();
    expect(replaceWaveMetadata).not.toHaveBeenCalled();
    await user.click(save());
    await waitFor(() => expect(save()).toBeEnabled());
    expect(screen.getByRole("alert")).toBeVisible();
    expect(summary()).toBeChecked();
    await user.click(save());
    await waitFor(() =>
      expect(edit()).toHaveAttribute("aria-expanded", "false")
    );
  });

  it.each([{ isLoading: true }, { isError: true }])(
    "does not edit unavailable metadata: %o",
    (state) => {
      setMetadata([], state);
      render(<WaveProposalCardSettings wave={wave} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    }
  );

  it("does not offer editing to an ineligible viewer", () => {
    (canEditWave as jest.Mock).mockReturnValue(false);
    render(<WaveProposalCardSettings wave={wave} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each(["isMemesWave", "isCurationWave", "isQuorumWave"])(
    "does not expose the control for %s",
    (flag) => {
      (useWave as jest.Mock).mockReturnValue({ [flag]: true });
      const { container } = render(<WaveProposalCardSettings wave={wave} />);
      expect(container).toBeEmptyDOMElement();
    }
  );
});
