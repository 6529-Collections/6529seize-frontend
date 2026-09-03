import {
  CONTENT_MODERATOR_ACCESS_QUERY_KEY,
  useContentModeratorAccess,
} from "@/hooks/content-moderation/useContentModeratorAccess";
import type { ApiContentModeratorAccess } from "@/generated/models/ApiContentModeratorAccess";
import { fetchContentModeratorAccess } from "@/services/api/content-moderation-api";
import {
  BLOCK_ACTIVITY_QUERY_KEY,
  MODERATION_QUEUE_QUERY_KEY,
  MY_CONTENT_MODERATION_REPORTS_QUERY_KEY,
  PUBLIC_PROFILE_MODERATION_STATUS_QUERY_KEY,
  SUSPENDED_MODERATION_PROFILES_QUERY_KEY,
} from "@/services/content-moderation/content-moderation-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

let mockProfileId: string | null = "moderator-1";
let mockProxy: { id: string } | null = null;

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockProfileId === null ? null : { id: mockProfileId },
    activeProfileProxy: mockProxy,
  }),
}));

jest.mock("@/services/api/content-moderation-api", () => ({
  fetchContentModeratorAccess: jest.fn(),
}));

const access: ApiContentModeratorAccess = {
  moderator: true,
  has_open_reports: true,
  open_report_count: 1,
  resolved_report_count: 0,
  suspended_profile_count: 1,
};
const accessKey = [...CONTENT_MODERATOR_ACCESS_QUERY_KEY, "moderator-1"];
const privateKeys = [
  [...MODERATION_QUEUE_QUERY_KEY, "OPEN"],
  [...MODERATION_QUEUE_QUERY_KEY, "RESOLVED"],
  SUSPENDED_MODERATION_PROFILES_QUERY_KEY,
  BLOCK_ACTIVITY_QUERY_KEY,
];

function mountAccess(client: QueryClient) {
  return renderHook(() => useContentModeratorAccess(), {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

describe("useContentModeratorAccess identity privacy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfileId = "moderator-1";
    mockProxy = null;
    jest.mocked(fetchContentModeratorAccess).mockResolvedValue(access);
  });

  it.each(["proxy", "signed out"])(
    "removes private caches when %s and requires fresh access on return",
    async (identity) => {
      const client = new QueryClient();
      client.setQueryData(accessKey, access);
      for (const key of privateKeys) {
        client.setQueryData(key, {
          pages: [["private data"]],
          pageParams: [undefined],
        });
      }
      client.setQueryData(MY_CONTENT_MODERATION_REPORTS_QUERY_KEY, [
        "my report",
      ]);
      client.setQueryData(
        PUBLIC_PROFILE_MODERATION_STATUS_QUERY_KEY,
        "public status"
      );
      const { result, rerender } = mountAccess(client);
      expect(result.current.data?.moderator).toBe(true);

      if (identity === "proxy") {
        mockProxy = { id: "proxy-1" };
      } else {
        mockProfileId = null;
      }
      rerender();
      expect(result.current.data).toBeUndefined();
      expect(client.getQueryData(accessKey)).toBeUndefined();
      for (const key of privateKeys) {
        expect(client.getQueryData(key)).toBeUndefined();
      }
      expect(
        client.getQueryData(MY_CONTENT_MODERATION_REPORTS_QUERY_KEY)
      ).toEqual(["my report"]);
      expect(
        client.getQueryData(PUBLIC_PROFILE_MODERATION_STATUS_QUERY_KEY)
      ).toBe("public status");
      await act(async () => {
        await client.invalidateQueries();
      });
      expect(fetchContentModeratorAccess).not.toHaveBeenCalled();

      jest
        .mocked(fetchContentModeratorAccess)
        .mockResolvedValue({ ...access, moderator: false });
      mockProxy = null;
      mockProfileId = "moderator-1";
      rerender();
      expect(result.current.data).toBeUndefined();
      await waitFor(() => expect(result.current.data?.moderator).toBe(false));
      expect(fetchContentModeratorAccess).toHaveBeenCalledTimes(1);
    }
  );

  it("discards late private and access responses after switching to a proxy", async () => {
    let resolveAccess!: (value: ApiContentModeratorAccess) => void;
    let resolvePrivate!: (value: string[]) => void;
    jest.mocked(fetchContentModeratorAccess).mockReturnValue(
      new Promise((resolve) => {
        resolveAccess = resolve;
      })
    );
    const privateResponse = new Promise<string[]>((resolve) => {
      resolvePrivate = resolve;
    });
    const client = new QueryClient();
    const { result, rerender } = mountAccess(client);
    const pending = privateKeys.map((queryKey) =>
      client
        .fetchQuery({
          queryKey,
          queryFn: () => privateResponse,
        })
        .catch(() => undefined)
    );
    expect(client.isFetching()).toBe(5);
    mockProxy = { id: "proxy-1" };
    rerender();
    await act(async () => {
      resolveAccess(access);
      resolvePrivate(["private data"]);
      await Promise.all(pending);
    });
    expect(result.current.data).toBeUndefined();
    expect(client.getQueryData(accessKey)).toBeUndefined();
    for (const key of privateKeys) {
      expect(client.getQueryData(key)).toBeUndefined();
    }
    expect(client.isFetching()).toBe(0);
  });
});
