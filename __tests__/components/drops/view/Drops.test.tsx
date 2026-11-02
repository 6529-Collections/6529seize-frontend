import { AuthContext } from "@/components/auth/Auth";
import Drops from "@/components/drops/view/Drops";
import { useInfiniteQuery } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams, useRouter } from "next/navigation";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => {
  const original = jest.requireActual("@tanstack/react-query");
  return { ...original, useInfiniteQuery: jest.fn() };
});

const dropsListSpy = jest.fn();
jest.mock("@/components/drops/view/DropsList", () => (props: any) => {
  dropsListSpy(props);
  return (
    <div data-testid="drops-list">
      <button onClick={() => props.onQuoteClick(props.drops[0])}>quote</button>
      {props.drops.length}
    </div>
  );
});

describe("Drops", () => {
  const observerInstances: any[] = [];

  beforeEach(() => {
    dropsListSpy.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useParams as jest.Mock).mockReturnValue({
      user: "alice",
    });
    (useInfiniteQuery as jest.Mock).mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      status: "success",
    });
    (global as any).IntersectionObserver = class {
      callback: any;
      constructor(cb: any) {
        this.callback = cb;
        observerInstances.push(this);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  function renderWithAuth() {
    const auth = { connectedProfile: null } as any;
    return render(
      <AuthContext.Provider value={auth}>
        <Drops />
      </AuthContext.Provider>
    );
  }

  it("shows placeholder when there are no drops", () => {
    renderWithAuth();
    expect(screen.getByText("No Drops to show")).toBeInTheDocument();
  });

  it("fetches next page on intersection and handles quote click", async () => {
    const drops = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      serial_no: i,
      wave: { id: `w${i}` },
    }));
    const fetchNext = jest.fn();
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (useParams as jest.Mock).mockReturnValue({
      user: "alice",
    });
    (useInfiniteQuery as jest.Mock).mockReturnValue({
      data: { pages: [drops] },
      fetchNextPage: fetchNext,
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      status: "success",
    });

    renderWithAuth();

    await screen.findByTestId("drops-list");

    act(() => {
      observerInstances.forEach((o) => o.callback([{ isIntersecting: true }]));
    });

    expect(fetchNext).toHaveBeenCalled();

    await userEvent.click(screen.getByText("quote"));
    expect(push).toHaveBeenCalledWith("/waves/w0?serialNo=0");
    expect(dropsListSpy).toHaveBeenCalledWith(
      expect.objectContaining({ drops: expect.any(Array) })
    );
  });

  it.each([null, { handle: "viewer" }])(
    "requests public-only drops on every page while preserving viewer authentication",
    async (connectedProfile) => {
      render(
        <AuthContext.Provider value={{ connectedProfile } as any}>
          <Drops />
        </AuthContext.Provider>
      );
      const options = jest.mocked(useInfiniteQuery).mock.calls.at(-1)![0];
      expect(options.queryKey).toEqual([
        QueryKey.PROFILE_DROPS,
        {
          handleOrWallet: "alice",
          context_profile: connectedProfile?.handle ?? null,
          public_only: true,
        },
      ]);
      const queryFn = options.queryFn as (context: {
        pageParam: number | null;
      }) => Promise<unknown>;
      for (const pageParam of [null, 123]) {
        await queryFn({ pageParam });
        expect(commonApiFetch).toHaveBeenLastCalledWith({
          endpoint: "/drops",
          params: {
            limit: "10",
            author: "alice",
            include_replies: "true",
            public_only: "true",
            ...(pageParam ? { serial_no_less_than: "123" } : {}),
            ...(connectedProfile ? { context_profile: "viewer" } : {}),
          },
        });
      }
    }
  );
});
