import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createTestQueryClient } from "@/__tests__/utils/reactQuery";
import GroupIdentitySelectedList from "@/components/groups/assignment/GroupIdentitySelectedList";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiFetch: jest.fn(),
}));

const wallet = (index: number) => `0x${index.toString(16).padStart(40, "0")}`;
const identity = (index: number): CommunityMemberMinimal => ({
  profile_id: null,
  handle: null,
  normalised_handle: null,
  primary_wallet: wallet(index),
  display: wallet(index),
  wallet: wallet(index),
  pfp: null,
  tdh: 0,
  level: 0,
  cic_rating: 0,
});

function renderList(
  identities: readonly CommunityMemberMinimal[],
  onRemove = jest.fn()
) {
  const client = createTestQueryClient();
  const view = render(
    <QueryClientProvider client={client}>
      <GroupIdentitySelectedList identities={identities} onRemove={onRemove} />
    </QueryClientProvider>
  );
  return { ...view, client, onRemove };
}

beforeEach(() => jest.clearAllMocks());

it("shows loading before a saved wallet resolves and preserves the exact removal wallet", async () => {
  let resolve: (value: unknown) => void = () => undefined;
  jest.mocked(commonApiFetch).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      })
  );
  const selected = identity(1);
  const { onRemove } = renderList([selected]);
  expect(screen.getByText("Loading profiles…")).toBeVisible();
  expect(screen.queryByText(selected.wallet)).not.toBeInTheDocument();
  expect(screen.queryByText(/Wallet 0x/)).not.toBeInTheDocument();
  await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(1));
  await act(async () =>
    resolve({
      id: "alpha",
      handle: "alpha",
      pfp: "https://example.com/avatar.png",
    })
  );
  expect(await screen.findByText("alpha")).toBeVisible();
  expect(document.querySelector("img")).toHaveAttribute("alt", "");
  await userEvent.click(
    screen.getByRole("button", { name: "Remove alpha, wallet 0x0000...0001" })
  );
  expect(onRemove).toHaveBeenCalledWith(selected.wallet);
  expect(selected).toEqual(identity(1));
});

it("keeps a no-profile wallet usable and never treats its address as a handle", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue({
    id: null,
    handle: wallet(2),
    display: wallet(2),
    pfp: null,
  });
  const { onRemove } = renderList([identity(2)]);
  expect(await screen.findByText("Wallet 0x0000...0002")).toBeVisible();
  expect(screen.queryByText(wallet(2))).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Remove.*0002/ }));
  expect(onRemove).toHaveBeenCalledWith(wallet(2));
});

it("uses ENS for a wallet without a profile and labels multiple wallets belonging to one handle", async () => {
  jest
    .mocked(commonApiFetch)
    .mockResolvedValueOnce({ handle: null, display: "example.eth" })
    .mockResolvedValue({ id: "alpha", handle: "alpha" });
  const { onRemove } = renderList([identity(1), identity(2), identity(3)]);
  expect(await screen.findByText("example.eth")).toBeVisible();
  await waitFor(() => expect(screen.getAllByText("alpha")).toHaveLength(2));
  await userEvent.click(
    screen.getByRole("button", { name: "Remove alpha, wallet 0x0000...0003" })
  );
  expect(onRemove).toHaveBeenCalledWith(wallet(3));
  expect(onRemove).toHaveBeenCalledTimes(1);
});

it("retains editing after a lookup failure and supports retry", async () => {
  jest
    .mocked(commonApiFetch)
    .mockRejectedValueOnce({ status: 503 })
    .mockResolvedValue({ handle: "recovered" });
  renderList([identity(1)]);
  expect(await screen.findByText("Wallet 0x0000...0001")).toBeVisible();
  await userEvent.click(
    screen.getByRole("button", { name: "Retry profile lookup" })
  );
  expect(await screen.findByText("recovered")).toBeVisible();
});

it("shows a missing profile as a usable wallet without retrying", async () => {
  jest.mocked(commonApiFetch).mockRejectedValue({ status: 404 });
  const { onRemove } = renderList([identity(1)]);
  expect(await screen.findByText("Wallet 0x0000...0001")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Retry profile lookup" })
  ).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Remove.*0001/ }));
  expect(onRemove).toHaveBeenCalledWith(wallet(1));
});

it("does not refetch freshly selected profiles", () => {
  renderList([{ ...identity(1), profile_id: "alpha", handle: "alpha" }]);
  expect(screen.getByText("alpha")).toBeVisible();
  expect(commonApiFetch).not.toHaveBeenCalled();
});

it("bounds rendering and concurrent requests for 10,000 wallets and reuses cached pages", async () => {
  const pending: Array<(value: unknown) => void> = [];
  jest.mocked(commonApiFetch).mockImplementation(
    () =>
      new Promise((resolve) => {
        pending.push(resolve);
      })
  );
  renderList(Array.from({ length: 10000 }, (_, index) => identity(index + 1)));
  expect(screen.getAllByRole("listitem")).toHaveLength(20);
  await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(4));
  for (let batch = 0; batch < 5; batch += 1) {
    await waitFor(() => expect(pending).toHaveLength(4));
    await act(async () => {
      pending.splice(0).forEach((resolve) => resolve({ handle: "alpha" }));
    });
  }
  await waitFor(() =>
    expect(screen.queryByText("Loading profiles…")).not.toBeInTheDocument()
  );
  expect(commonApiFetch).toHaveBeenCalledTimes(20);
  jest.mocked(commonApiFetch).mockResolvedValue({ handle: "beta" });
  await userEvent.click(screen.getByRole("button", { name: "Next wallets" }));
  expect(await screen.findByText("Wallets 21–40 of 10,000")).toBeVisible();
  await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(40));
  await userEvent.click(
    screen.getByRole("button", { name: "Previous wallets" })
  );
  expect(screen.getByText("Wallets 1–20 of 10,000")).toBeVisible();
  expect(commonApiFetch).toHaveBeenCalledTimes(40);
});

it("keeps the clamped page when wallets are removed and later added", async () => {
  const identities = Array.from({ length: 41 }, (_, index) => ({
    ...identity(index + 1),
    handle: `profile-${index}`,
  }));
  const { client, rerender, onRemove } = renderList(identities);
  const replaceIdentities = (next: readonly CommunityMemberMinimal[]) =>
    rerender(
      <QueryClientProvider client={client}>
        <GroupIdentitySelectedList identities={next} onRemove={onRemove} />
      </QueryClientProvider>
    );
  await userEvent.click(screen.getByRole("button", { name: "Next wallets" }));
  await userEvent.click(screen.getByRole("button", { name: "Next wallets" }));
  expect(screen.getByText("Wallets 41–41 of 41")).toBeVisible();

  replaceIdentities(identities.slice(0, 2));
  expect(screen.getByText("profile-0")).toBeVisible();
  replaceIdentities(identities);
  expect(screen.getByText("Wallets 1–20 of 41")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Previous wallets" })
  ).toBeDisabled();
});
