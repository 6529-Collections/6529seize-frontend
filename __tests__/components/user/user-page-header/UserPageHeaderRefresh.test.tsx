import UserPageHeaderRefresh from "@/components/user/user-page-header/UserPageHeaderRefresh";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  dehydrate,
  type DehydratedState,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { act, render } from "@testing-library/react";

const statementsKey = [QueryKey.PROFILE_CIC_STATEMENTS, "alice"];

const snapshotWith = (
  statements: unknown,
  updatedAt: number
): DehydratedState => {
  const source = new QueryClient();
  source.setQueryData(statementsKey, statements, { updatedAt });
  const snapshot = dehydrate(source);
  source.clear();
  return snapshot;
};

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("UserPageHeaderRefresh", () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient();
  });

  afterEach(() => client.clear());

  const renderRefresh = (state: Promise<DehydratedState>) =>
    render(
      <QueryClientProvider client={client}>
        <UserPageHeaderRefresh state={state} />
      </QueryClientProvider>
    );

  it("applies the header snapshot once it arrives", async () => {
    const snapshot = deferred<DehydratedState>();
    const { container } = renderRefresh(snapshot.promise);

    expect(container).toBeEmptyDOMElement();
    expect(client.getQueryData(statementsKey)).toBeUndefined();

    await act(async () => {
      snapshot.resolve(snapshotWith(["server bio"], 1000));
    });

    expect(client.getQueryData(statementsKey)).toEqual(["server bio"]);
  });

  it("keeps newer local data when a slower snapshot arrives", async () => {
    client.setQueryData(statementsKey, ["edited bio"], { updatedAt: 2000 });

    await act(async () => {
      renderRefresh(Promise.resolve(snapshotWith(["server bio"], 1000)));
    });

    expect(client.getQueryData(statementsKey)).toEqual(["edited bio"]);
  });

  it("ignores a snapshot that arrives after the page has left", async () => {
    const snapshot = deferred<DehydratedState>();
    const view = renderRefresh(snapshot.promise);
    view.unmount();

    await act(async () => {
      snapshot.resolve(snapshotWith(["server bio"], 1000));
    });

    expect(client.getQueryData(statementsKey)).toBeUndefined();
  });

  it("leaves the cache unchanged when the snapshot fails", async () => {
    const snapshot = deferred<DehydratedState>();
    renderRefresh(snapshot.promise);

    await act(async () => {
      snapshot.reject(new Error("Header snapshot unavailable"));
    });

    expect(client.getQueryData(statementsKey)).toBeUndefined();
  });
});
