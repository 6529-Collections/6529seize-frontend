import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { createGeneralQueryHandlers } from "@/components/react-query-wrapper/ReactQueryWrapper.generalHandlers";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";

const waveKey = [QueryKey.WAVE, { wave_id: "private-wave" }];

it("cancels inactive wave prefetches before auth invalidation", async () => {
  const client = new QueryClient();
  const { invalidateAuthSensitiveQueries } = createGeneralQueryHandlers(
    client,
    jest.fn()
  );
  const previousViewer = Promise.withResolvers<{ name: string }>();
  let requestSignal: AbortSignal | undefined;
  const prefetch = client.prefetchQuery({
    queryKey: waveKey,
    queryFn: ({ signal }) => {
      requestSignal = signal;
      return previousViewer.promise;
    },
  });
  client.setQueryData([QueryKey.GLOBAL_TDH_STATS], { total: 1 });

  invalidateAuthSensitiveQueries();
  const wasAborted = requestSignal?.aborted;
  previousViewer.resolve({ name: "Previous viewer's private conversation" });
  await prefetch;

  expect(wasAborted).toBe(true);
  expect(client.getQueryData(waveKey)).toBeUndefined();
  expect(client.getQueryData([QueryKey.GLOBAL_TDH_STATS])).toEqual({ total: 1 });

  await client.prefetchQuery({
    queryKey: waveKey,
    queryFn: async () => ({ name: "Current viewer's conversation" }),
  });
  expect(client.getQueryData(waveKey)).toEqual({
    name: "Current viewer's conversation",
  });
  client.clear();
});

it("refetches active wave queries after cancelling the previous viewer's request", async () => {
  const client = new QueryClient();
  const { invalidateAuthSensitiveQueries } = createGeneralQueryHandlers(
    client,
    jest.fn()
  );
  const previousViewer = Promise.withResolvers<{ name: string }>();
  const currentViewer = { name: "Current viewer's conversation" };
  const queryFn = jest
    .fn()
    .mockImplementationOnce(() => previousViewer.promise)
    .mockResolvedValue(currentViewer);
  const observer = new QueryObserver(client, { queryKey: waveKey, queryFn });
  const unsubscribe = observer.subscribe(() => undefined);

  invalidateAuthSensitiveQueries();
  previousViewer.resolve({ name: "Previous viewer's private conversation" });
  await client.getQueryCache().find({ queryKey: waveKey })?.promise;

  expect(queryFn).toHaveBeenCalledTimes(2);
  expect(client.getQueryData(waveKey)).toEqual(currentViewer);
  unsubscribe();
  client.clear();
});
