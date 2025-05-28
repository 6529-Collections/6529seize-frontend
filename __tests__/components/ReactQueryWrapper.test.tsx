import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import React, { useContext, useEffect } from "react";
import ReactQueryWrapper, { ReactQueryWrapperContext, QueryKey } from "../../components/react-query-wrapper/ReactQueryWrapper";

function useContextValue() {
  const ctx = useContext(ReactQueryWrapperContext);
  return ctx;
}

test("setProfile stores profile under all handles", () => {
  const queryClient = new QueryClient();
  let context: any;
  function Child() {
    context = useContextValue();
    return null;
  }
  render(
    <QueryClientProvider client={queryClient}>
      <ReactQueryWrapper>
        <Child />
      </ReactQueryWrapper>
    </QueryClientProvider>
  );

  const profile = {
    handle: "Alice",
    wallets: [{ wallet: "0xabc", display: "ABC" }],
  } as any;
  context.setProfile(profile);
  expect(queryClient.getQueryData([QueryKey.PROFILE, "alice"])).toEqual(profile);
  expect(queryClient.getQueryData([QueryKey.PROFILE, "0xabc"])).toEqual(profile);
});

test("waitAndInvalidateDrops invalidates drop queries", async () => {
  jest.useFakeTimers();
  const queryClient = new QueryClient();
  const spy = jest.spyOn(queryClient, "invalidateQueries");
  let context: any;
  function Child() {
    context = useContextValue();
    return null;
  }
  render(
    <QueryClientProvider client={queryClient}>
      <ReactQueryWrapper>
        <Child />
      </ReactQueryWrapper>
    </QueryClientProvider>
  );

  const promise = context.waitAndInvalidateDrops();
  await act(async () => {
    jest.advanceTimersByTime(500);
    await promise;
  });
  expect(spy).toHaveBeenCalledWith({ queryKey: [QueryKey.DROPS] });
  jest.useRealTimers();
});
