import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  E2eeMessageAvatar,
  E2eeMessageIdentity,
} from "@/components/e2ee/conversation/E2eeMessageIdentity";
import { getE2eeProfileQueryOptions } from "@/components/e2ee/e2eeProfiles";
import { commonApiFetch } from "@/services/api/common-api";
import { ALICE_ID, member } from "./fakeE2eeEngine";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const fetchMock = jest.mocked(commonApiFetch);
const alice = member(ALICE_ID, "alice");
const profile = {
  id: ALICE_ID,
  handle: "alice",
  level: 51,
  classification: "PSEUDONYM",
  profile_wave_id: "alice-wave",
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
};

function renderProfile(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return client;
}

describe("encrypted message sender profiles", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("shows the usual level and profile wave with one cached lookup per person", async () => {
    fetchMock.mockImplementation(async ({ endpoint }) =>
      endpoint === `identities/${ALICE_ID}`
        ? profile
        : { id: "alice-wave", name: "Alice's wave", picture: null }
    );
    renderProfile(
      <>
        <E2eeMessageIdentity
          member={alice}
          fallbackName="alice"
          messageId="one"
        />
        <E2eeMessageIdentity
          member={alice}
          fallbackName="alice"
          messageId="two"
        />
      </>
    );
    expect(await screen.findAllByLabelText("Level 51")).toHaveLength(2);
    expect(
      await screen.findAllByRole("button", { name: "Open Alice's wave" })
    ).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "alice" })[0]).toHaveAttribute(
      "href",
      "/alice"
    );
    expect(
      fetchMock.mock.calls.filter(
        ([request]) => request.endpoint === `identities/${ALICE_ID}`
      )
    ).toHaveLength(1);
    expect(
      fetchMock.mock.calls.filter(
        ([request]) => request.endpoint === "waves/alice-wave"
      )
    ).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: `identities/${ALICE_ID}` })
    );
  });

  it("uses the handle even when the fallback for the viewer is You", () => {
    fetchMock.mockResolvedValue({ ...profile, profile_wave_id: null });
    renderProfile(
      <E2eeMessageIdentity member={alice} fallbackName="You" messageId="own" />
    );
    expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute(
      "href",
      "/alice"
    );
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  it("retains the known identity if its public metadata is unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const client = renderProfile(
      <E2eeMessageIdentity
        member={alice}
        fallbackName="alice"
        messageId="offline"
      />
    );
    await waitFor(() =>
      expect(
        client.getQueryState(getE2eeProfileQueryOptions(ALICE_ID).queryKey)
          ?.status
      ).toBe("error")
    );
    expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute(
      "href",
      "/alice"
    );
    expect(screen.queryByLabelText(/Level/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open featured wave" })
    ).not.toBeInTheDocument();
  });

  it("does not decorate a sender with another profile's metadata", async () => {
    fetchMock.mockResolvedValue({
      ...profile,
      id: "someone-else",
      handle: "impostor",
    });
    const client = renderProfile(
      <E2eeMessageIdentity
        member={alice}
        fallbackName="alice"
        messageId="mismatch"
      />
    );
    await waitFor(() =>
      expect(
        client.getQueryState(getE2eeProfileQueryOptions(ALICE_ID).queryKey)
          ?.status
      ).toBe("success")
    );
    expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute(
      "href",
      "/alice"
    );
    expect(screen.queryByText("impostor")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Level/)).not.toBeInTheDocument();
  });

  it("leaves unknown authors unlinked without looking up an invented identity", () => {
    renderProfile(
      <E2eeMessageIdentity
        member={null}
        fallbackName="Unknown member"
        messageId="unknown"
      />
    );
    expect(screen.getByText("Unknown member")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves an initially unnamed sender's avatar and profile link from the same cache", async () => {
    fetchMock.mockResolvedValue({
      ...profile,
      pfp: "https://example.com/alice.png",
      profile_wave_id: null,
    });
    const unnamed = member(ALICE_ID, "alice");
    unnamed.handle = null;
    renderProfile(
      <>
        <E2eeMessageAvatar member={unnamed} fallbackName="You" />
        <E2eeMessageIdentity
          member={unnamed}
          fallbackName="You"
          messageId="self"
        />
      </>
    );
    const avatar = await screen.findByRole("link", {
      name: "View alice's profile",
    });
    expect(avatar).toHaveAttribute("href", "/alice");
    expect(avatar.querySelector("img")).toHaveAttribute(
      "src",
      "https://example.com/alice.png"
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
