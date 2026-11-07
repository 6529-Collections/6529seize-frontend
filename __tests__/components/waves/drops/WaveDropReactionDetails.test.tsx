import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import WaveDropReaction from "@/components/waves/drops/WaveDropReaction";
import WaveDropReactions from "@/components/waves/drops/WaveDropReactions";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { fetchDropReactionDetailsV2 } from "@/services/api/wave-drops-v2-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";

jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/drops/useDropReactionView", () => ({
  useDropReactionView: jest.fn(),
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    emojiMap: [],
    findNativeEmoji: jest.fn(),
    loadEmojiData: () => Promise.resolve(),
  }),
}));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropReactionDetailsV2: jest.fn(),
}));
jest.mock("@/components/waves/drops/WaveDropReaction", () => ({
  __esModule: true,
  default: jest.fn(
    ({
      reaction,
      onTooltipOpenChange,
      onOpenDetailDialog,
      isDetailsLoading,
    }: {
      reaction: ApiDropReaction & { count: number };
      onTooltipOpenChange: (reaction: string, open: boolean) => void;
      onOpenDetailDialog: (reaction: string) => void;
      isDetailsLoading: boolean;
    }) => (
      <button
        onMouseEnter={() => onTooltipOpenChange(reaction.reaction, true)}
        onMouseLeave={() => onTooltipOpenChange(reaction.reaction, false)}
        onClick={() => onOpenDetailDialog(reaction.reaction)}
        aria-label={`Inspect ${reaction.reaction}`}
        aria-busy={isDetailsLoading}
      >
        {reaction.count}:{" "}
        {reaction.profiles.map((profile) => profile.handle).join(", ")}
      </button>
    )
  ),
}));
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default:
    () =>
    ({
      reactions,
      onClose,
    }: {
      reactions: ApiDropReaction[];
      onClose: () => void;
    }) => (
      <div role="dialog" aria-label="Reactions">
        {reactions.flatMap((reaction) =>
          reaction.profiles.map((profile) => (
            <span key={profile.id}>{profile.handle}</span>
          ))
        )}
        <button onClick={onClose}>Close</button>
      </div>
    ),
}));

const fetchDetails = jest.mocked(fetchDropReactionDetailsV2);
const profile = (id: string) => ({ id, handle: id }) as ApiProfileMin;
const details = (...ids: string[]): ApiDropReaction[] => [
  { reaction: ":gm:", profiles: ids.map(profile) },
];
const drop = (count: number, id = "drop-1"): ApiDrop =>
  ({
    id,
    reactions: [{ reaction: ":gm:", count, profiles: [] }],
    context_profile_context: { reaction: null },
  }) as unknown as ApiDrop;

function mount(initialDrop: ApiDrop) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    ...render(<WaveDropReactions drop={initialDrop} />, { wrapper }),
    client,
  };
}

const chip = () => screen.getByRole("button", { name: "Inspect :gm:" });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    connectedProfile: null,
    activeProfileProxy: null,
  } as ReturnType<typeof useAuth>);
});

test("loads only viewed details, refreshes additions/removals in place, and stays idle after closing", async () => {
  fetchDetails.mockResolvedValueOnce(details("alice"));
  const { rerender } = mount(drop(1));
  expect(fetchDetails).not.toHaveBeenCalled();
  fireEvent.mouseEnter(chip());
  await waitFor(() => expect(chip()).toHaveTextContent("1: alice"));
  const originalChip = chip();

  fetchDetails.mockResolvedValueOnce(details("alice", "bob"));
  rerender(<WaveDropReactions drop={drop(2)} />);
  await waitFor(() => expect(chip()).toHaveTextContent("2: alice, bob"));
  expect(chip()).toBe(originalChip);

  fetchDetails.mockResolvedValueOnce(details("alice"));
  rerender(<WaveDropReactions drop={drop(1)} />);
  await waitFor(() => expect(chip()).toHaveTextContent("1: alice"));
  await waitFor(() => expect(chip()).not.toHaveTextContent("bob"));

  fireEvent.mouseLeave(chip());
  rerender(<WaveDropReactions drop={drop(3)} />);
  expect(fetchDetails).toHaveBeenCalledTimes(3);
  fetchDetails.mockResolvedValueOnce(details("alice", "carol", "dave"));
  fireEvent.mouseEnter(chip());
  await waitFor(() =>
    expect(chip()).toHaveTextContent("3: alice, carol, dave")
  );
});

test("rechecks membership on reopen even when the count is unchanged", async () => {
  fetchDetails.mockResolvedValueOnce(details("alice"));
  mount(drop(1));
  fireEvent.mouseEnter(chip());
  await waitFor(() => expect(chip()).toHaveTextContent("alice"));
  fireEvent.mouseLeave(chip());
  fetchDetails.mockResolvedValueOnce(details("bob"));
  fireEvent.mouseEnter(chip());
  await waitFor(() => expect(chip()).toHaveTextContent("bob"));
  expect(chip()).not.toHaveTextContent("alice");
});

test("refreshes an open dialog without requiring another interaction", async () => {
  fetchDetails.mockResolvedValueOnce(details("alice", "bob"));
  const { rerender } = mount(drop(2));
  fireEvent.click(chip());
  const dialog = screen.getByRole("dialog", { name: "Reactions" });
  await waitFor(() => expect(dialog).toHaveTextContent("bob"));
  fetchDetails.mockResolvedValueOnce(details("alice"));
  rerender(<WaveDropReactions drop={drop(1)} />);
  await waitFor(() => expect(dialog).not.toHaveTextContent("bob"));
  expect(dialog).toHaveTextContent("alice");
  expect(screen.getByRole("dialog")).toBe(dialog);
});

test("does not cache a failed request as an empty success and retries on reopening", async () => {
  fetchDetails.mockRejectedValueOnce(new Error("Offline"));
  mount(drop(1));
  fireEvent.mouseEnter(chip());
  await waitFor(() => expect(chip()).toHaveAttribute("aria-busy", "false"));
  fireEvent.mouseLeave(chip());
  fetchDetails.mockResolvedValueOnce(details("alice"));
  fireEvent.mouseEnter(chip());
  await waitFor(() => expect(chip()).toHaveTextContent("alice"));
  expect(fetchDetails).toHaveBeenCalledTimes(2);
});

test("cancels an outdated request and does not replace newer membership with its late response", async () => {
  let resolveOld!: (value: ApiDropReaction[]) => void;
  const oldRequest = new Promise<ApiDropReaction[]>((resolve) => {
    resolveOld = resolve;
  });
  fetchDetails.mockReturnValueOnce(oldRequest);
  const { rerender } = mount(drop(2));
  fireEvent.mouseEnter(chip());
  await waitFor(() => expect(fetchDetails).toHaveBeenCalledTimes(1));
  const oldSignal = fetchDetails.mock.calls[0]![1]!;
  fetchDetails.mockResolvedValueOnce(details("alice"));
  rerender(<WaveDropReactions drop={drop(1)} />);
  await waitFor(() => expect(chip()).toHaveTextContent("1: alice"));
  expect(oldSignal.aborted).toBe(true);
  await act(async () => resolveOld(details("alice", "bob")));
  expect(chip()).not.toHaveTextContent("bob");
});

test("preserves known profiles during a refresh without carrying them across drops", async () => {
  fetchDetails.mockResolvedValueOnce(details("alice"));
  const { rerender } = mount(drop(1));
  fireEvent.mouseEnter(chip());
  await waitFor(() => expect(chip()).toHaveTextContent("alice"));
  fetchDetails.mockReturnValue(new Promise(() => {}));
  rerender(<WaveDropReactions drop={drop(2)} />);
  expect(chip()).toHaveTextContent("alice");
  expect(chip()).toHaveAttribute("aria-busy", "false");

  rerender(<WaveDropReactions drop={drop(2, "drop-2")} />);
  expect(chip()).not.toHaveTextContent("alice");
  expect(fetchDetails).toHaveBeenCalledTimes(2);
});

test("keeps the viewer's optimistic unreact out of a still-settling server list", async () => {
  jest.mocked(useAuth).mockReturnValue({
    connectedProfile: { id: "alice", handle: "alice" },
    activeProfileProxy: null,
  } as unknown as ReturnType<typeof useAuth>);
  fetchDetails.mockResolvedValue(details("alice", "bob"));
  mount(drop(1));
  fireEvent.mouseEnter(chip());
  await waitFor(() => expect(chip()).toHaveTextContent("1: bob"));
  expect(chip()).not.toHaveTextContent("alice");
});

test("shares one in-flight details request between views of the same drop", async () => {
  let resolveDetails!: (value: ApiDropReaction[]) => void;
  fetchDetails.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveDetails = resolve;
    })
  );
  const { rerender } = mount(drop(1));
  rerender(
    <>
      <WaveDropReactions drop={drop(1)} />
      <WaveDropReactions drop={drop(1)} />
    </>
  );
  const chips = screen.getAllByRole("button", { name: "Inspect :gm:" });
  fireEvent.mouseEnter(chips[0]!);
  fireEvent.mouseEnter(chips[1]!);
  await waitFor(() => expect(fetchDetails).toHaveBeenCalledTimes(1));
  await act(async () => resolveDetails(details("alice")));
  await waitFor(() => {
    for (const button of chips) expect(button).toHaveTextContent("1: alice");
  });
});

test("does not show the previous viewer's cached list after an account switch", async () => {
  fetchDetails.mockResolvedValueOnce(details("alice"));
  const { rerender } = mount(drop(1));
  fireEvent.mouseEnter(chip());
  await waitFor(() => expect(chip()).toHaveTextContent("alice"));
  jest.mocked(useAuth).mockReturnValue({
    connectedProfile: { id: "carol", handle: "carol" },
    activeProfileProxy: null,
  } as unknown as ReturnType<typeof useAuth>);
  fetchDetails.mockReturnValue(new Promise(() => {}));
  rerender(<WaveDropReactions drop={drop(1)} />);
  expect(chip()).not.toHaveTextContent("alice");
});

test("preserves the server's profile order when the viewer is already included", async () => {
  jest.mocked(useAuth).mockReturnValue({
    connectedProfile: { id: "alice", handle: "alice" },
    activeProfileProxy: null,
  } as unknown as ReturnType<typeof useAuth>);
  fetchDetails.mockResolvedValue(details("alice", "bob"));
  const viewerDrop = drop(2);
  mount({
    ...viewerDrop,
    context_profile_context: {
      ...viewerDrop.context_profile_context!,
      reaction: ":gm:",
    },
  });
  fireEvent.mouseEnter(chip());
  await waitFor(() => expect(chip()).toHaveTextContent("2: alice, bob"));
});

test("does not rerender reaction chips for an unchanged background response", async () => {
  fetchDetails.mockImplementation(async () => details("alice"));
  const { client } = mount(drop(1));
  fireEvent.mouseEnter(chip());
  await waitFor(() => expect(chip()).toHaveTextContent("1: alice"));
  const rendered = jest.mocked(WaveDropReaction).mock.calls.length;

  await act(async () => {
    await client.invalidateQueries({
      queryKey: [QueryKey.DROP_REACTIONS, "drop-1"],
    });
  });

  expect(fetchDetails).toHaveBeenCalledTimes(2);
  expect(jest.mocked(WaveDropReaction)).toHaveBeenCalledTimes(rendered);
});

test("does not refetch for an unrelated drop update with unchanged reactions", async () => {
  fetchDetails.mockResolvedValue(details("alice"));
  const { rerender } = mount(drop(1));
  fireEvent.mouseEnter(chip());
  await waitFor(() => expect(chip()).toHaveTextContent("1: alice"));
  rerender(<WaveDropReactions drop={{ ...drop(1), title: "Updated title" }} />);
  expect(fetchDetails).toHaveBeenCalledTimes(1);
});

test.each([{ profiles: [] }, { profiles: [profile("alice")] }])(
  "keeps partial names in the loading/count fallback without losing the viewer's selection (%j)",
  async ({ profiles }) => {
    jest.mocked(useAuth).mockReturnValue({
      connectedProfile: { id: "alice", handle: "alice" },
      activeProfileProxy: null,
    } as unknown as ReturnType<typeof useAuth>);
    let rejectDetails!: (error: Error) => void;
    fetchDetails.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectDetails = reject;
      })
    );
    const viewerDrop = drop(2);
    mount({
      ...viewerDrop,
      reactions: [{ ...viewerDrop.reactions[0]!, profiles }],
      context_profile_context: {
        ...viewerDrop.context_profile_context!,
        reaction: ":gm:",
      },
    });
    fireEvent.mouseEnter(chip());
    await waitFor(() => expect(chip()).toHaveAttribute("aria-busy", "true"));
    expect(chip()).toHaveTextContent("2:");
    expect(chip()).not.toHaveTextContent("alice");
    expect(
      jest.mocked(WaveDropReaction).mock.lastCall?.[0].drop
        .context_profile_context?.reaction
    ).toBe(":gm:");

    await act(async () => rejectDetails(new Error("Offline")));
    await waitFor(() => expect(chip()).toHaveAttribute("aria-busy", "false"));
    expect(chip()).not.toHaveTextContent("alice");
    fireEvent.mouseLeave(chip());
    fetchDetails.mockResolvedValueOnce(details("alice", "bob"));
    fireEvent.mouseEnter(chip());
    await waitFor(() => expect(chip()).toHaveTextContent("2: alice, bob"));
  }
);
