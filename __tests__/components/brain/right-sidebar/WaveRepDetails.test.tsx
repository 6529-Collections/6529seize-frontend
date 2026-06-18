import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WaveRepDetails from "@/components/brain/right-sidebar/WaveRepDetails";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/components/react-query-wrapper/utils/query-utils", () => ({
  getDefaultQueryRetry: () => ({ retry: false }),
}));

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  CircleLoaderSize: { MEDIUM: "MEDIUM" },
  default: () => <span data-testid="loader" />,
}));

const commonApiFetchMock = commonApiFetch as jest.Mock;

const wave = {
  id: "wave-1",
  wave_rep: {
    total_rep: 9,
    positive_rep: 12,
    negative_rep: -3,
    contributor_count: 2,
    authenticated_user_contribution: 4,
  },
} as ApiWave;

const longCategory =
  "quality dive bar experience with a long label that should stay readable";

function profile({
  id,
  handle,
  primary_address = "0x1111111111111111111111111111111111111111",
}: {
  readonly id: string;
  readonly handle: string | null;
  readonly primary_address?: string;
}) {
  return {
    id,
    handle,
    pfp: null,
    primary_address,
  };
}

function renderDetails() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <WaveRepDetails wave={wave} />
    </QueryClientProvider>
  );
}

describe("WaveRepDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    commonApiFetchMock.mockImplementation(
      ({ endpoint }: { endpoint: string }) => {
        if (endpoint === "waves/wave-1/rep/overview") {
          return Promise.resolve({
            total_rep: 42,
            positive_rep: 47,
            negative_rep: -5,
            authenticated_user_contribution: 7,
            contributor_count: 2,
            contributors: {
              data: [
                {
                  contribution: 47,
                  profile: profile({ id: "p1", handle: "alice" }),
                },
                {
                  contribution: -5,
                  profile: profile({ id: "p2", handle: "bob" }),
                },
              ],
              page: 1,
              next: true,
            },
          });
        }

        if (endpoint === "waves/wave-1/rep/categories") {
          return Promise.resolve({
            data: [
              {
                category: "quality",
                total_rep: 30,
                contributor_count: 1,
                authenticated_user_contribution: 7,
                top_contributors: [],
              },
              {
                category: longCategory,
                total_rep: 12,
                contributor_count: 1,
                authenticated_user_contribution: null,
                top_contributors: [],
              },
            ],
            page: 1,
            next: true,
          });
        }

        if (endpoint === "waves/wave-1/rep/categories/quality/contributors") {
          return Promise.resolve({
            data: [
              {
                contribution: 30,
                profile: profile({ id: "p3", handle: "carol" }),
              },
            ],
            page: 1,
            next: false,
          });
        }

        if (endpoint === "profile-logs") {
          return Promise.resolve({
            data: [
              {
                id: "log-1",
                profile_handle: "alice",
                created_at: new Date(Date.now() - 60_000),
                contents: {
                  old_rating: 10,
                  new_rating: 30,
                  rating_category: "quality",
                  change_reason: "USER_EDIT",
                  rating_matter: "WAVE_REP",
                },
              },
            ],
            page: 1,
            next: true,
          });
        }

        return Promise.reject(new Error(`Unexpected endpoint ${endpoint}`));
      }
    );
  });

  it("loads overview and categories initially without loading activity logs", async () => {
    renderDetails();

    await screen.findByText("alice");
    expect(screen.getAllByText("+42").length).toBeGreaterThan(0);
    expect(screen.getByText("+7")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(
      screen.getByText("All contributors by Wave REP")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Show contributors in quality,/i })
    ).toBeInTheDocument();

    expect(
      commonApiFetchMock.mock.calls.some(
        ([call]) => call.endpoint === "profile-logs"
      )
    ).toBe(false);

    const categoryCall = commonApiFetchMock.mock.calls.find(
      ([call]) => call.endpoint === "waves/wave-1/rep/categories"
    )?.[0];
    expect(categoryCall.params).toEqual({
      page: "1",
      page_size: "100",
    });
  });

  it("loads contributors for a selected category", async () => {
    renderDetails();

    fireEvent.click(
      await screen.findByRole("button", {
        name: /^Show contributors in quality,/i,
      })
    );

    await waitFor(() =>
      expect(commonApiFetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "waves/wave-1/rep/categories/quality/contributors",
        })
      )
    );
    expect(await screen.findByText("carol")).toBeInTheDocument();
    expect(screen.getByText("Contributors in quality")).toBeInTheDocument();
    expect(screen.getAllByTitle("quality").length).toBeGreaterThan(0);
  });

  it("keeps long category names available and loads more categories", async () => {
    commonApiFetchMock.mockImplementation(
      ({
        endpoint,
        params,
      }: {
        endpoint: string;
        params?: { page?: string };
      }) => {
        if (endpoint === "waves/wave-1/rep/overview") {
          return Promise.resolve({
            total_rep: 42,
            positive_rep: 47,
            negative_rep: -5,
            authenticated_user_contribution: 7,
            contributor_count: 2,
            contributors: {
              data: [
                {
                  contribution: 47,
                  profile: profile({ id: "p1", handle: "alice" }),
                },
              ],
              page: 1,
              next: false,
            },
          });
        }

        if (endpoint === "waves/wave-1/rep/categories") {
          if (params?.page === "2") {
            return Promise.resolve({
              data: [
                {
                  category: "helpful",
                  total_rep: 9,
                  contributor_count: 1,
                  authenticated_user_contribution: null,
                  top_contributors: [],
                },
              ],
              page: 2,
              next: false,
            });
          }
          return Promise.resolve({
            data: [
              {
                category: longCategory,
                total_rep: 12,
                contributor_count: 1,
                authenticated_user_contribution: null,
                top_contributors: [],
              },
            ],
            page: 1,
            next: true,
          });
        }

        return Promise.reject(new Error(`Unexpected endpoint ${endpoint}`));
      }
    );

    renderDetails();

    const longCategoryButton = await screen.findByTitle(longCategory);
    expect(longCategoryButton).toHaveAttribute(
      "aria-label",
      expect.stringContaining(longCategory)
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Load more categories" })
    );

    await waitFor(() =>
      expect(commonApiFetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "waves/wave-1/rep/categories",
          params: { page: "2", page_size: "100" },
        })
      )
    );
    expect(await screen.findByText("helpful")).toBeInTheDocument();
  });

  it("loads more all-contributor pages", async () => {
    commonApiFetchMock.mockImplementation(
      ({
        endpoint,
        params,
      }: {
        endpoint: string;
        params?: { page?: string };
      }) => {
        if (endpoint === "waves/wave-1/rep/overview") {
          if (params?.page === "2") {
            return Promise.resolve({
              total_rep: 42,
              positive_rep: 47,
              negative_rep: -5,
              authenticated_user_contribution: 7,
              contributor_count: 3,
              contributors: {
                data: [
                  {
                    contribution: 1,
                    profile: profile({ id: "p4", handle: "dana" }),
                  },
                ],
                page: 2,
                next: false,
              },
            });
          }

          return Promise.resolve({
            total_rep: 42,
            positive_rep: 47,
            negative_rep: -5,
            authenticated_user_contribution: 7,
            contributor_count: 3,
            contributors: {
              data: [
                {
                  contribution: 47,
                  profile: profile({ id: "p1", handle: "alice" }),
                },
              ],
              page: 1,
              next: true,
            },
          });
        }

        if (endpoint === "waves/wave-1/rep/categories") {
          return Promise.resolve({ data: [], page: 1, next: false });
        }

        return Promise.reject(new Error(`Unexpected endpoint ${endpoint}`));
      }
    );

    renderDetails();

    fireEvent.click(
      await screen.findByRole("button", { name: "Load more contributors" })
    );

    await waitFor(() =>
      expect(commonApiFetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "waves/wave-1/rep/overview",
          params: { page: "2", page_size: "50" },
        })
      )
    );
    expect(await screen.findByText("dana")).toBeInTheDocument();
  });

  it("loads activity lazily and paginates logs", async () => {
    commonApiFetchMock.mockImplementation(
      ({
        endpoint,
        params,
      }: {
        endpoint: string;
        params?: { page?: string };
      }) => {
        if (endpoint === "waves/wave-1/rep/overview") {
          return Promise.resolve({
            total_rep: 42,
            positive_rep: 47,
            negative_rep: -5,
            authenticated_user_contribution: 7,
            contributor_count: 2,
            contributors: {
              data: [
                {
                  contribution: 47,
                  profile: profile({ id: "p1", handle: "alice" }),
                },
              ],
              page: 1,
              next: false,
            },
          });
        }

        if (endpoint === "waves/wave-1/rep/categories") {
          return Promise.resolve({ data: [], page: 1, next: false });
        }

        if (endpoint === "profile-logs") {
          if (params?.page === "2") {
            return Promise.resolve({
              data: [
                {
                  id: "log-2",
                  profile_handle: "bob",
                  created_at: new Date(Date.now() - 120_000),
                  contents: {
                    old_rating: 30,
                    new_rating: 20,
                    rating_category: "quality",
                    change_reason: "LOST_TDH",
                    rating_matter: "WAVE_REP",
                  },
                },
              ],
              page: 2,
              next: false,
            });
          }

          return Promise.resolve({
            data: [
              {
                id: "log-1",
                profile_handle: "alice",
                created_at: new Date(Date.now() - 60_000),
                contents: {
                  old_rating: 10,
                  new_rating: 30,
                  rating_category: "quality",
                  change_reason: "USER_EDIT",
                  rating_matter: "WAVE_REP",
                },
              },
            ],
            page: 1,
            next: true,
          });
        }

        return Promise.reject(new Error(`Unexpected endpoint ${endpoint}`));
      }
    );

    renderDetails();

    await screen.findByText("alice");
    expect(
      commonApiFetchMock.mock.calls.some(
        ([call]) => call.endpoint === "profile-logs"
      )
    ).toBe(false);

    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));

    expect(await screen.findByText("Wave REP activity")).toBeInTheDocument();
    expect(await screen.findByText("(+20)")).toBeInTheDocument();
    expect(screen.queryByText("User Edit")).toBeNull();
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "profile-logs",
        params: expect.objectContaining({
          page: "1",
          page_size: "20",
          target: "wave-1",
          log_type: "RATING_EDIT",
          rating_matter: "WAVE_REP",
        }),
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Load more activity" }));

    await waitFor(() =>
      expect(commonApiFetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "profile-logs",
          params: expect.objectContaining({ page: "2", page_size: "20" }),
        })
      )
    );
    expect(await screen.findByText("bob")).toBeInTheDocument();
    expect(screen.getByText("Lost Tdh")).toBeInTheDocument();
  });

  it("renders empty states", async () => {
    commonApiFetchMock.mockImplementation(
      ({ endpoint }: { endpoint: string }) => {
        if (endpoint === "waves/wave-1/rep/overview") {
          return Promise.resolve({
            total_rep: 0,
            positive_rep: 0,
            negative_rep: 0,
            authenticated_user_contribution: null,
            contributor_count: 0,
            contributors: { data: [], page: 1, next: false },
          });
        }

        if (endpoint === "waves/wave-1/rep/categories") {
          return Promise.resolve({ data: [], page: 1, next: false });
        }

        if (endpoint === "profile-logs") {
          return Promise.resolve({ data: [], page: 1, next: false });
        }

        return Promise.reject(new Error(`Unexpected endpoint ${endpoint}`));
      }
    );

    renderDetails();

    expect(await screen.findByText("No Wave REP yet.")).toBeInTheDocument();
    expect(screen.getByText("No REP categories yet.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));

    expect(
      await screen.findByText("No Wave REP activity yet.")
    ).toBeInTheDocument();
  });

  it("renders local API error states", async () => {
    commonApiFetchMock.mockImplementation(
      ({ endpoint }: { endpoint: string }) => {
        if (
          endpoint === "waves/wave-1/rep/overview" ||
          endpoint === "waves/wave-1/rep/categories" ||
          endpoint === "profile-logs"
        ) {
          return Promise.reject(new Error("failed"));
        }

        return Promise.reject(new Error(`Unexpected endpoint ${endpoint}`));
      }
    );

    renderDetails();

    expect(
      await screen.findByText("Could not load contributors.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Could not load categories.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));

    expect(
      await screen.findByText("Could not load Wave REP activity.")
    ).toBeInTheDocument();
  });
});
