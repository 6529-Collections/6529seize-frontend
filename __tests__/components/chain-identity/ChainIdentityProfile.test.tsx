import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Config } from "wagmi";
import ChainIdentityProfile from "@/components/chain-identity/ChainIdentityProfile";
import {
  ChainGatewayError,
  type ChainIdentity,
} from "@/lib/chain-identity/gateway";
import {
  prepareProfileReplace,
  readCurrentProfile,
} from "@/lib/chain-identity/profileSave";

jest.mock("@/lib/chain-identity/profileSave", () => ({
  ...jest.requireActual("@/lib/chain-identity/profileSave"),
  readCurrentProfile: jest.fn(),
  prepareProfileReplace: jest.fn(),
}));

const WALLET = "0x00000000000000000000000000000000000000aa" as const;
const identity = {
  principalId: `0x${"0a".repeat(32)}`,
  profile: { docCid: `0x01551220${"11".repeat(32)}`, version: 3, updatedHeight: 70 },
} as unknown as ChainIdentity;

const renderProfile = () =>
  render(
    <ChainIdentityProfile
      wallet={WALLET}
      config={{} as Config}
      identity={identity}
      sessionKey={null}
      onChanged={jest.fn()}
    />
  );

beforeEach(() => jest.clearAllMocks());

it.each([
  [
    "import_running",
    "The 6529 Network is still importing identities. You can change your profile once that is done, usually within an hour.",
  ],
  [
    "imported_doc_missing",
    "Your imported profile isn't in 6529's document store yet, so it can't be changed. Try again later.",
  ],
  [
    "http_502",
    "Your current profile couldn't be read, so it can't be changed yet. Try again in a minute.",
  ],
])("says why it can't save (%s) and keeps save off", async (code, text) => {
  (readCurrentProfile as jest.Mock).mockRejectedValue(
    new ChainGatewayError(503, code, "refused")
  );
  renderProfile();
  expect(await screen.findByText(text, {}, { timeout: 5_000 })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save profile" })).toBeDisabled();
});

it("sends only the edited field over the current document", async () => {
  (readCurrentProfile as jest.Mock).mockResolvedValue({
    doc: {
      principal: identity.principalId,
      version: 3,
      prev: "0x",
      fields: new Map([
        ["bio", "gm\n"],
        ["website", "https://a.test"],
      ]),
    },
    unreadable: false,
  });
  (prepareProfileReplace as jest.Mock).mockImplementation(
    () => new Promise(() => undefined)
  );
  renderProfile();
  const website = await screen.findByLabelText("Website");
  await waitFor(() => expect(website).toHaveValue("https://a.test"));
  fireEvent.change(website, { target: { value: " https://b.test " } });
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await waitFor(() => expect(prepareProfileReplace).toHaveBeenCalled());
  const fields = (prepareProfileReplace as jest.Mock).mock.calls[0][1] as Map<
    string,
    string
  >;
  expect(Object.fromEntries(fields)).toEqual({
    bio: "gm\n",
    website: "https://b.test",
  });
});
