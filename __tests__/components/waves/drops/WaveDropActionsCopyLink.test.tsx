import WaveDropActionsCopyLink from "@/components/waves/drops/WaveDropActionsCopyLink";
import { ApiDropType } from "@/generated/models/ApiDropType";
import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";

const mockIsMemesWave = jest.fn();
const mockIsQuorumWave = jest.fn();

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

const writeText = jest.fn().mockResolvedValue(undefined);
Object.assign(navigator, { clipboard: { writeText } });

describe("WaveDropActionsCopyLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsMemesWave.mockReturnValue(false);
    mockIsQuorumWave.mockReturnValue(false);
  });

  it("copies serial jump links for non-memes drops", () => {
    const drop: any = {
      id: "d1",
      wave: { id: "w1" },
      serial_no: 5,
      drop_type: ApiDropType.Chat,
    };
    const { getByRole } = render(<WaveDropActionsCopyLink drop={drop} />);
    fireEvent.click(getByRole("button"));
    expect(writeText).toHaveBeenCalledWith("https://base/waves/w1?serialNo=5");
  });

  it("copies canonical drop links for memes submissions", () => {
    mockIsMemesWave.mockReturnValue(true);

    const drop: any = {
      id: "d1",
      wave: { id: "w1" },
      serial_no: 5,
      drop_type: ApiDropType.Participatory,
    };
    const { getByRole } = render(<WaveDropActionsCopyLink drop={drop} />);
    fireEvent.click(getByRole("button"));
    expect(writeText).toHaveBeenCalledWith("https://base/waves/w1?drop=d1");
  });

  it("copies canonical drop links for quorum participation drops", () => {
    mockIsQuorumWave.mockReturnValue(true);

    const drop: any = {
      id: "d1",
      wave: { id: "w1" },
      serial_no: 5,
      drop_type: ApiDropType.Participatory,
    };
    const { getByRole } = render(<WaveDropActionsCopyLink drop={drop} />);
    fireEvent.click(getByRole("button"));
    expect(writeText).toHaveBeenCalledWith("https://base/waves/w1?drop=d1");
  });

  it("disables button for temporary drop", () => {
    const drop: any = { id: "temp-1", wave: { id: "w1" }, serial_no: 1 };
    const { getByRole } = render(<WaveDropActionsCopyLink drop={drop} />);
    expect(getByRole("button")).toBeDisabled();
    fireEvent.click(getByRole("button"));
    expect(writeText).not.toHaveBeenCalled();
  });
});
