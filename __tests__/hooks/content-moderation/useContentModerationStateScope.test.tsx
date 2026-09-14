import {
  CONTENT_MODERATOR_ACCESS_QUERY_KEY,
  useContentModerationStateScope,
} from "@/hooks/content-moderation/useContentModerationStateScope";
import {
  MODERATION_CHECKS_QUERY_KEY,
  MY_CONTENT_MODERATION_REPORTS_QUERY_KEY,
} from "@/services/content-moderation/content-moderation-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

it("closes the private surface immediately when any private request loses server authorization", async () => {
  const client = new QueryClient();
  renderHook(() => useContentModerationStateScope("developer-1", null), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  const accessKey = [...CONTENT_MODERATOR_ACCESS_QUERY_KEY, "developer-1"];
  client.setQueryData(accessKey, { moderator: true });
  const detailKey = [
    ...MODERATION_CHECKS_QUERY_KEY,
    "developer-1",
    "detail",
    "one",
  ];
  const personalKey = [
    ...MY_CONTENT_MODERATION_REPORTS_QUERY_KEY,
    "developer-1",
  ];
  client.setQueryData(personalKey, { reported_content: "own report" });
  client.setQueryData(detailKey, { evidence: "private" });
  await act(async () => {
    await client
      .fetchQuery({
        queryKey: [...MODERATION_CHECKS_QUERY_KEY, "developer-1", "counts"],
        queryFn: () => Promise.reject({ status: 403 }),
        retry: false,
      })
      .catch(() => undefined);
  });
  expect(client.getQueryData(accessKey)).toEqual(
    expect.objectContaining({ moderator: false })
  );
  expect(client.getQueryData(detailKey)).toBeUndefined();
  expect(client.getQueryData(personalKey)).toEqual({
    reported_content: "own report",
  });
});

it("clears personal report caches on profile and proxy changes, including old unscoped entries", () => {
  const client = new QueryClient();
  const { rerender } = renderHook(
    ({ profile, proxy }: { profile: string | null; proxy: string | null }) =>
      useContentModerationStateScope(profile, proxy),
    {
      initialProps: { profile: "profile-a", proxy: null } as {
        profile: string | null;
        proxy: string | null;
      },
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }
  );
  const oldKey = [...MY_CONTENT_MODERATION_REPORTS_QUERY_KEY, "profile-a"];
  const nextKey = [...MY_CONTENT_MODERATION_REPORTS_QUERY_KEY, "profile-b"];
  client.setQueryData(MY_CONTENT_MODERATION_REPORTS_QUERY_KEY, "legacy");
  client.setQueryData(oldKey, "old reports");
  client.setQueryData(nextKey, "current reports");

  rerender({ profile: "profile-b", proxy: null });
  expect(client.getQueryData(oldKey)).toBeUndefined();
  expect(
    client.getQueryData(MY_CONTENT_MODERATION_REPORTS_QUERY_KEY)
  ).toBeUndefined();
  expect(client.getQueryData(nextKey)).toBe("current reports");

  rerender({ profile: "profile-b", proxy: "proxy" });
  expect(
    client.getQueriesData({ queryKey: MY_CONTENT_MODERATION_REPORTS_QUERY_KEY })
  ).toEqual([]);
});
