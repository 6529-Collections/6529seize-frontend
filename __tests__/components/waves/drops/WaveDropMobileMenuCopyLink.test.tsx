import WaveDropMobileMenuCopyLink from "@/components/waves/drops/WaveDropMobileMenuCopyLink";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockIsMemesWave = jest.fn();
const mockIsQuorumWave = jest.fn();
const writeText = jest.fn().mockResolvedValue(undefined);

jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://base",
  },
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    isMemesWave: mockIsMemesWave,
    isQuorumWave: mockIsQuorumWave,
  }),
}));

Object.assign(navigator, { clipboard: { writeText } });

describe("WaveDropMobileMenuCopyLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsMemesWave.mockReturnValue(false);
    mockIsQuorumWave.mockReturnValue(false);
  });

  it("copies serial jump links and closes the menu", async () => {
    const onCopy = jest.fn();
    const drop: any = {
      id: "d1",
      wave: { id: "w1" },
      serial_no: 5,
      drop_type: ApiDropType.Chat,
    };

    render(<WaveDropMobileMenuCopyLink drop={drop} onCopy={onCopy} />);

    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith("https://base/waves/w1?serialNo=5");
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("copies canonical drop links for memes submissions", async () => {
    mockIsMemesWave.mockReturnValue(true);
    const onCopy = jest.fn();
    const drop: any = {
      id: "d1",
      wave: { id: "w1" },
      serial_no: 5,
      drop_type: ApiDropType.Participatory,
    };

    render(<WaveDropMobileMenuCopyLink drop={drop} onCopy={onCopy} />);

    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith("https://base/waves/w1?drop=d1");
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("disables copy for temporary drops", async () => {
    const onCopy = jest.fn();
    const drop: any = {
      id: "temp-1",
      wave: { id: "w1" },
      serial_no: 5,
      drop_type: ApiDropType.Chat,
    };

    render(<WaveDropMobileMenuCopyLink drop={drop} onCopy={onCopy} />);

    const button = screen.getByRole("button", { name: "Copy link" });

    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(writeText).not.toHaveBeenCalled();
    expect(onCopy).not.toHaveBeenCalled();
  });
});
