import {
  CONTENT_MODERATOR_ACCESS_QUERY_KEY,
  useContentModerationStateScope,
} from "@/hooks/content-moderation/useContentModerationStateScope";
import { MODERATION_CHECKS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
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
});
