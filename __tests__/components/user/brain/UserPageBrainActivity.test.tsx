import { render, screen } from "@testing-library/react";
import UserPageBrainActivity from "@/components/user/brain/UserPageBrainActivity";
import { useIdentityActivity } from "@/hooks/useIdentityActivity";
import { Time } from "@/helpers/time";

jest.mock("@/hooks/useIdentityActivity", () => ({
  useIdentityActivity: jest.fn(),
}));

const mockedUseIdentityActivity = useIdentityActivity as jest.MockedFunction<
  typeof useIdentityActivity
>;
const DAY_MS = Time.days(1).toMillis();

function buildActivityResponse() {
  const lastDate = new Date(Date.UTC(2026, 2, 16));
  const startMs = lastDate.getTime() - 364 * DAY_MS;

  return {
    last_date: "16.03.2026",
    date_samples: Array.from({ length: 365 }, (_, index) => {
      const isoDate = new Date(startMs + index * DAY_MS)
        .toISOString()
        .slice(0, 10);

      switch (isoDate) {
        case "2026-01-01":
          return 1;
        case "2026-02-01":
          return 2;
        case "2026-03-03":
          return 3;
        case "2026-03-04":
          return 4;
        case "2026-03-16":
          return 2;
        default:
          return 0;
      }
    }),
  };
}

describe("UserPageBrainActivity", () => {
  beforeEach(() => {
    mockedUseIdentityActivity.mockReset();
  });

  it("renders a loading skeleton", () => {
    mockedUseIdentityActivity.mockReturnValue({
      status: "pending",
      data: undefined,
    } as any);

    render(
      <UserPageBrainActivity
        profile={{ handle: "alice", primary_wallet: "0x1" } as any}
      />
    );

    expect(screen.getByTestId("brain-activity-card")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Loading activity heatmap")
    ).toBeInTheDocument();
  });

  it("renders a compact error state", () => {
    mockedUseIdentityActivity.mockReturnValue({
      status: "error",
      error: new Error("boom"),
      data: undefined,
    } as any);

    render(
      <UserPageBrainActivity
        profile={{ handle: "alice", primary_wallet: "0x1" } as any}
      />
    );

    expect(screen.getByText("Unable to load activity.")).toBeInTheDocument();
  });

  it("renders the activity bars and summary", () => {
    mockedUseIdentityActivity.mockReturnValue({
      status: "success",
      data: buildActivityResponse(),
    } as any);

    render(
      <UserPageBrainActivity
        profile={{ handle: "alice", primary_wallet: "0x1" } as any}
      />
    );

    expect(mockedUseIdentityActivity).toHaveBeenCalledWith({
      identity: "alice",
      enabled: true,
    });
    expect(
      screen.getByText("12 public posts in the last 12 months")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Jan 1, 2026: 1 public post" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Mar 16, 2026: 2 public posts" })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Public activity heatmap for the last 12 months")
    ).toBeInTheDocument();
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Feb")).toBeInTheDocument();
    expect(screen.getAllByText("Mar")).not.toHaveLength(0);
  });

  it("falls back to the primary wallet when the handle is missing", () => {
    mockedUseIdentityActivity.mockReturnValue({
      status: "success",
      data: buildActivityResponse(),
    } as any);

    render(
      <UserPageBrainActivity
        profile={{ handle: null, primary_wallet: "0xabc" } as any}
      />
    );

    expect(mockedUseIdentityActivity).toHaveBeenCalledWith({
      identity: "0xabc",
      enabled: true,
    });
  });
});
