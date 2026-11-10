import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { E2eeRemoveLocalData } from "@/components/e2ee/gate/E2eeRemoveLocalData";
import {
  hasE2eeEnrollmentMarker,
  setE2eeEnrollmentMarker,
} from "@/components/e2ee/e2eeLocalState";

const mockRestart = jest.fn();
let mockProfileId: string | null = "profile-1";
jest.mock("@/hooks/e2ee/useE2ee", () => ({
  useE2ee: () => ({ profileId: mockProfileId, restart: mockRestart }),
}));
const mockRemove = jest.fn();
jest.mock("@/lib/e2ee/local-data", () => ({
  removeE2eeProfileLocalData: (...args: unknown[]) => mockRemove(...args),
}));

describe("E2eeRemoveLocalData", () => {
  beforeEach(() => {
    mockRestart.mockReset();
    mockRemove.mockReset().mockResolvedValue(undefined);
    mockProfileId = "profile-1";
    globalThis.localStorage.clear();
  });

  it("removes this browser's encrypted messages after confirming, without a running engine", async () => {
    setE2eeEnrollmentMarker("profile-1", true);
    render(<E2eeRemoveLocalData />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove encrypted messages from this browser",
      })
    );
    const dialog = screen.getByRole("dialog", {
      name: "Remove encrypted messages from this browser?",
    });
    expect(
      within(dialog).getByText(/deletes the encrypted chats, attachment keys/)
    ).toBeVisible();
    expect(mockRemove).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    });

    expect(mockRemove).toHaveBeenCalledWith("profile-1");
    expect(hasE2eeEnrollmentMarker("profile-1")).toBe(false);
    expect(mockRestart).toHaveBeenCalledTimes(1);
  });

  it("explains a failed removal and keeps the dialog open", async () => {
    mockRemove.mockRejectedValueOnce(new Error("blocked"));
    render(<E2eeRemoveLocalData />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove encrypted messages from this browser",
      })
    );
    const dialog = screen.getByRole("dialog");
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn’t remove encrypted messages from this browser. Try again."
    );
    expect(mockRestart).not.toHaveBeenCalled();
  });

  it("renders nothing without a signed-in profile", () => {
    mockProfileId = null;
    const { container } = render(<E2eeRemoveLocalData />);
    expect(container).toBeEmptyDOMElement();
  });
});
