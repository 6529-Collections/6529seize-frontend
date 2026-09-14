import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import StudioWalletImport from "@/components/profile-cms-builder/studio/StudioWalletImport";
import { isProfileCmsBuilderApiEnabledEnv } from "@/config/profileCmsBuilderEnv";
import { requestProfileCmsGallerySnapshot } from "@/lib/profile-cms/builder/api";
import { createMockWalletGallerySnapshot } from "@/lib/profile-cms/builder/gallery";
import {
  buildCmsPackageCandidate,
  createDefaultCmsBuilderState,
} from "@/lib/profile-cms/builder/package";
import {
  withComputedCmsHashes,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";

jest.mock("@/lib/profile-cms/builder/api", () => ({
  requestProfileCmsGallerySnapshot: jest.fn(),
}));
jest.mock("@/config/profileCmsBuilderEnv", () => ({
  isProfileCmsBuilderApiEnabledEnv: jest.fn(),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { src: string; alt: string }) => (
    <img src={props.src} alt={props.alt} />
  ),
}));

const NOW = new Date("2026-09-10T12:00:00.000Z");
const BASE = buildCmsPackageCandidate(
  createDefaultCmsBuilderState("exampleprofile"),
  NOW
);
const SNAPSHOT = {
  ...createMockWalletGallerySnapshot({
    handle: "otherowner",
    sources: [],
    now: NOW,
  }),
  source: "backend" as const,
};
const request = jest.mocked(requestProfileCmsGallerySnapshot);

function mount(canRequestSnapshot = true, document = BASE) {
  const onChange = jest.fn<void, [CmsPackageV1]>();
  return {
    ...render(
      <StudioWalletImport
        document={document}
        locale="en-US"
        canRequestSnapshot={canRequestSnapshot}
        onChange={onChange}
      />
    ),
    onChange,
  };
}

async function loadSnapshot() {
  fireEvent.change(screen.getByLabelText("Wallets or ENS names"), {
    target: { value: "punk6529.eth" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Request snapshot" }));
  await screen.findByRole("checkbox", {
    name: `Select ${SNAPSHOT.assets[0]!.title}`,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(isProfileCmsBuilderApiEnabledEnv).mockReturnValue(true);
  request.mockResolvedValue(SNAPSHOT);
});

it("blocks anonymous real requests and associates the sign-in explanation", () => {
  mount(false);
  const button = screen.getByRole("button", { name: "Request snapshot" });
  expect(button).toBeDisabled();
  expect(button).toHaveAccessibleDescription(
    "Sign in to request a wallet snapshot."
  );
  fireEvent.click(button);
  expect(request).not.toHaveBeenCalled();
});

it("allows any authenticated session to review another wallet, then adds only explicit selections", async () => {
  const { onChange } = mount();
  await loadSnapshot();
  expect(request).toHaveBeenCalledWith({
    handle: "exampleprofile",
    sources: [
      { kind: "ens", input: "punk6529.eth", normalized: "punk6529.eth" },
    ],
  });
  expect(onChange).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "Add selected works" })
  ).toBeDisabled();
  expect(
    screen
      .getAllByRole("checkbox")
      .every((input) => !(input as HTMLInputElement).checked)
  ).toBe(true);
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: `Select ${SNAPSHOT.assets[0]!.title}`,
    })
  );
  fireEvent.click(screen.getByRole("button", { name: "Add selected works" }));
  expect(onChange).toHaveBeenCalledTimes(1);
  const updated = onChange.mock.calls[0]![0];
  expect(updated.payload.pages.slice(0, BASE.payload.pages.length)).toEqual(
    BASE.payload.pages
  );
  expect(updated.site).toEqual(BASE.site);
  expect(updated.payload.nft_media_profiles).toHaveLength(1);
  expect(screen.getByText(/were added as a new gallery/)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Add selected works" })
  ).toBeDisabled();
});

it("shows a helpful session error for401 and retains a reviewed snapshot after refresh failure", async () => {
  mount();
  await loadSnapshot();
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: `Select ${SNAPSHOT.assets[0]!.title}`,
    })
  );
  request.mockRejectedValueOnce({ status: 401 });
  fireEvent.click(screen.getByRole("button", { name: "Request snapshot" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Your session could not be verified. Sign in again to request a wallet snapshot."
  );
  expect(
    screen.getByRole("button", { name: "Request snapshot" })
  ).toHaveAccessibleDescription(
    "Your session could not be verified. Sign in again to request a wallet snapshot."
  );
  expect(
    screen.getByRole("checkbox", {
      name: `Select ${SNAPSHOT.assets[0]!.title}`,
    })
  ).toBeChecked();
});

it("keeps explicit fixture mode usable while signed out", async () => {
  jest.mocked(isProfileCmsBuilderApiEnabledEnv).mockReturnValue(false);
  request.mockResolvedValueOnce({ ...SNAPSHOT, source: "fixture" });
  mount(false);
  await loadSnapshot();
  expect(request).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Example snapshot/)).toBeInTheDocument();
});

it("locks replacement and import controls during refresh and uses the latest complete document afterward", async () => {
  const { onChange, rerender } = mount();
  await loadSnapshot();
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: `Select ${SNAPSHOT.assets[0]!.title}`,
    })
  );
  let complete!: (snapshot: typeof SNAPSHOT) => void;
  request.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      })
  );
  fireEvent.click(screen.getByRole("button", { name: "Request snapshot" }));
  expect(
    screen.getByRole("button", { name: "Add selected works" })
  ).toBeDisabled();
  expect(screen.getByLabelText("Wallets or ENS names")).toBeDisabled();
  const edited = withComputedCmsHashes({
    ...BASE,
    site: { ...BASE.site, title: "Edited while snapshot was loading" },
  });
  rerender(
    <StudioWalletImport
      document={edited}
      locale="en-US"
      canRequestSnapshot
      onChange={onChange}
    />
  );
  await act(async () => {
    complete(SNAPSHOT);
  });
  fireEvent.click(screen.getByRole("button", { name: "Add selected works" }));
  expect(onChange.mock.calls[0]![0].site.title).toBe(edited.site.title);
});

it("does not carry an in-flight snapshot into another profile", async () => {
  let complete!: (snapshot: typeof SNAPSHOT) => void;
  request.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      })
  );
  const { rerender, onChange } = mount();
  fireEvent.change(screen.getByLabelText("Wallets or ENS names"), {
    target: { value: "punk6529.eth" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Request snapshot" }));
  const other = buildCmsPackageCandidate(
    createDefaultCmsBuilderState("newprofile"),
    NOW
  );
  rerender(
    <StudioWalletImport
      document={other}
      locale="en-US"
      canRequestSnapshot
      onChange={onChange}
    />
  );
  await act(async () => {
    complete(SNAPSHOT);
  });
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Wallets or ENS names")).toHaveValue("");
  expect(
    screen.getByRole("button", { name: "Request snapshot" })
  ).toBeEnabled();
});

it("rejects invalid sources without unresolved placeholders or a request", async () => {
  mount();
  fireEvent.change(screen.getByLabelText("Wallets or ENS names"), {
    target: { value: "not-a-wallet" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Request snapshot" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "These wallet entries need attention: not-a-wallet"
    )
  );
  expect(request).not.toHaveBeenCalled();
});
