import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CreateCurationDropContent from "@/components/waves/CreateCurationDropContent";
import * as optimisticDrops from "@/components/waves/utils/getOptimisticDrop";
import { ApiDrop } from "@/generated/models/ApiDrop";
import type { ComponentProps } from "react";
import userEvent from "@testing-library/user-event";
import { act, render, screen, waitFor } from "@testing-library/react";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/i18n/locales";
import { loadLocaleMessages, t } from "@/i18n/messages";

let mockLocale: SupportedLocale = "en-US";
const mockRequestAuth = jest.fn(async () => ({ success: true }));
const mockAddOptimisticDrop = jest.fn(async () => {});
const mockSignDrop = jest.fn(async () => ({
  success: true,
  signature: "0xabc",
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => mockLocale,
}));

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => () => null,
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({
    isSafeWallet: false,
    address: null,
  })),
}));

jest.mock("@/hooks/drops/useDropSignature", () => ({
  useDropSignature: jest.fn(() => ({
    signDrop: mockSignDrop,
  })),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamActions: jest.fn(() => ({
    processIncomingDrop: jest.fn(),
  })),
}));

jest.mock("@/contexts/EditingDropContext", () => ({
  useEditingDrop: jest.fn(() => ({
    editingDropId: null,
    setEditingDropId: jest.fn(),
  })),
}));

jest.mock("@/components/waves/CreateDropReplyingWrapper", () => ({
  __esModule: true,
  default: () => null,
}));

const wave = {
  id: "wave-1",
  wave: { type: "CHAT" },
  chat: { enabled: true },
  participation: {
    signature_required: false,
    terms: null,
  },
  metrics: {},
} as any;

const URL_A =
  "https://opensea.io/item/ethereum/0x1234567890abcdef1234567890abcdef12345678/123";
const URL_B =
  "https://opensea.io/item/ethereum/0x1234567890abcdef1234567890abcdef12345678/456";

const createContent = (
  overrides: Partial<ComponentProps<typeof CreateCurationDropContent>> = {}
) => (
  <AuthContext.Provider
    value={
      {
        requestAuth: mockRequestAuth,
        setToast: jest.fn(),
        connectedProfile: null,
      } as any
    }
  >
    <ReactQueryWrapperContext.Provider
      value={{ addOptimisticDrop: mockAddOptimisticDrop } as any}
    >
      <CreateCurationDropContent
        activeDrop={null}
        onCancelReplyQuote={jest.fn()}
        wave={wave}
        dropId={null}
        isDropMode={true}
        initialUrl={null}
        submitDrop={jest.fn()}
        {...overrides}
      />
    </ReactQueryWrapperContext.Provider>
  </AuthContext.Provider>
);

describe("CreateCurationDropContent supported URLs", () => {
  beforeEach(() => {
    mockLocale = "en-US";
    jest.clearAllMocks();
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ["sibling", 4],
    ["selected", 5],
  ])(
    "does not enqueue a submission authenticated before retargeting to %s version %s",
    async (id, version) => {
      const user = userEvent.setup();
      let resolveAuth!: (result: { success: boolean }) => void;
      mockRequestAuth.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveAuth = resolve;
        })
      );
      const optimistic = jest
        .spyOn(optimisticDrops, "getOptimisticDrop")
        .mockReturnValue(
          Object.assign(new ApiDrop(), { id: "optimistic-old" })
        );
      const submitDrop = jest.fn();
      const props = {
        initialUrl: URL_A,
        submitDrop,
        wave: {
          ...wave,
          competition: {
            id: "selected",
            wave_id: wave.id,
            config_version: 4,
            participation: { terms: "Original competition terms." },
          },
        },
      };
      const { rerender } = render(createContent(props));
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("textbox", { name: "Curation URL" }));
      await user.keyboard("{Enter}");
      expect(mockRequestAuth).toHaveBeenCalledTimes(1);
      rerender(
        createContent({
          ...props,
          wave: {
            ...props.wave,
            competition: {
              ...props.wave.competition,
              id,
              config_version: version,
            },
          },
        })
      );
      await act(async () => resolveAuth({ success: true }));
      expect(optimistic).not.toHaveBeenCalled();
      expect(mockAddOptimisticDrop).not.toHaveBeenCalled();
      expect(mockSignDrop).not.toHaveBeenCalled();
      expect(submitDrop).not.toHaveBeenCalled();
      expect(screen.getByRole("textbox", { name: "Curation URL" })).toHaveValue(
        URL_A
      );
    }
  );

  it("does not enqueue prepared legacy content after retargeting to a native competition", async () => {
    const user = userEvent.setup();
    let resolveSignature!: (result: {
      success: boolean;
      signature: string;
    }) => void;
    mockSignDrop.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSignature = resolve;
      })
    );
    const optimistic = jest
      .spyOn(optimisticDrops, "getOptimisticDrop")
      .mockReturnValue(Object.assign(new ApiDrop(), { id: "optimistic-old" }));
    const submitDrop = jest.fn();
    const props = {
      initialUrl: URL_A,
      submitDrop,
      wave: {
        ...wave,
        participation: { ...wave.participation, signature_required: true },
      },
    };
    const { rerender } = render(createContent(props));
    await user.click(screen.getByRole("textbox", { name: "Curation URL" }));
    await user.keyboard("{Enter}");
    await waitFor(() => expect(mockSignDrop).toHaveBeenCalledTimes(1));
    rerender(
      createContent({
        ...props,
        wave: {
          ...props.wave,
          competition: {
            id: "selected",
            wave_id: wave.id,
            config_version: 4,
            participation: { terms: "Retargeted competition terms." },
          },
        },
      })
    );
    await act(async () =>
      resolveSignature({ success: true, signature: "old-signature" })
    );
    expect(optimistic).not.toHaveBeenCalled();
    expect(mockAddOptimisticDrop).not.toHaveBeenCalled();
    expect(submitDrop).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Curation URL" })).toHaveValue(
      URL_A
    );
  });

  describe.each(["default", "leaderboard"] as const)(
    "%s composer",
    (variant) => {
      it.each(SUPPORTED_LOCALES)(
        "announces attempted submission without terms consent in locale %s",
        async (locale) => {
          await loadLocaleMessages(locale);
          mockLocale = locale;
          const user = userEvent.setup();
          const submitDrop = jest.fn();
          const terms = "This competition’s versioned terms.";
          render(
            createContent({
              curationComposerVariant: variant,
              initialUrl: URL_A,
              submitDrop,
              wave: {
                ...wave,
                competition: {
                  id: "selected",
                  wave_id: wave.id,
                  config_version: 4,
                  participation: { terms },
                },
              },
            })
          );
          const checkbox = screen.getByRole("checkbox", {
            name: t(locale, "competitions.terms"),
          });
          const submitButton = screen.getByRole("button", {
            name: variant === "leaderboard" ? "Submit to Curation" : "Drop",
          });
          const requiredMessage = t(locale, "competitions.termsRequired");
          expect(requiredMessage.trim()).not.toBe("");
          expect(checkbox).not.toHaveAttribute("aria-invalid", "true");
          expect(checkbox).toHaveAccessibleDescription(terms);
          expect(submitButton).toBeDisabled();
          expect(screen.queryByRole("alert")).toBeNull();
          const url = screen.getByRole("textbox", { name: "Curation URL" });
          await user.click(url);
          await user.keyboard("{Enter}");
          expect(screen.getByRole("alert")).toHaveTextContent(requiredMessage);
          expect(checkbox).toHaveAttribute("aria-invalid", "true");
          expect(checkbox).toHaveAccessibleDescription(
            `${terms} ${requiredMessage}`
          );
          expect(submitButton).toBeDisabled();
          expect(mockRequestAuth).not.toHaveBeenCalled();
          expect(mockSignDrop).not.toHaveBeenCalled();
          expect(submitDrop).not.toHaveBeenCalled();
          await user.click(checkbox);
          expect(checkbox).not.toHaveAttribute("aria-invalid", "true");
          expect(checkbox).toHaveAccessibleDescription(terms);
          expect(screen.queryByRole("alert")).toBeNull();
          expect(submitButton).toBeEnabled();
          await user.click(url);
          await user.keyboard("{Enter}");
          await waitFor(() => expect(submitDrop).toHaveBeenCalledTimes(1));
          expect(mockRequestAuth).toHaveBeenCalledTimes(1);
          expect(mockSignDrop).not.toHaveBeenCalled();
          expect(submitDrop).toHaveBeenCalledWith(
            expect.objectContaining({
              drop: expect.objectContaining({
                wave_id: wave.id,
                drop_type: "PARTICIPATORY",
                signature: null,
                parts: [expect.objectContaining({ content: URL_A })],
              }),
            })
          );
        }
      );
    }
  );

  it.each([
    ["sibling", "wave-1"],
    ["selected", "wave-2"],
  ])(
    "requires fresh consent for competition %s in wave %s at the same version",
    async (id, waveId) => {
      const user = userEvent.setup();
      const submitDrop = jest.fn();
      const props = {
        initialUrl: URL_A,
        submitDrop,
        wave: {
          ...wave,
          competition: {
            id: "selected",
            wave_id: wave.id,
            config_version: 4,
            participation: { terms: "Original competition terms." },
          },
        },
      };
      const { rerender } = render(createContent(props));
      await user.click(screen.getByRole("checkbox"));
      expect(screen.getByRole("checkbox")).toBeChecked();
      rerender(
        createContent({
          ...props,
          wave: {
            ...props.wave,
            id: waveId,
            competition: {
              ...props.wave.competition,
              id,
              wave_id: waveId,
              participation: { terms: "Retargeted competition terms." },
            },
          },
        })
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
      expect(checkbox).toHaveAccessibleDescription(
        "Retargeted competition terms."
      );
      expect(screen.queryByRole("alert")).toBeNull();
      const url = screen.getByRole("textbox", { name: "Curation URL" });
      await user.click(url);
      await user.keyboard("{Enter}");
      expect(screen.getByRole("alert")).toBeVisible();
      expect(mockRequestAuth).not.toHaveBeenCalled();
      expect(mockSignDrop).not.toHaveBeenCalled();
      expect(submitDrop).not.toHaveBeenCalled();
      await user.click(checkbox);
      await user.click(url);
      await user.keyboard("{Enter}");
      await waitFor(() => expect(submitDrop).toHaveBeenCalledTimes(1));
      expect(mockRequestAuth).toHaveBeenCalledTimes(1);
    }
  );

  it.each([
    ["selected", 5],
    ["sibling", 4],
  ])(
    "resets attempted terms feedback for competition %s version %s",
    async (id, version) => {
      const user = userEvent.setup();
      const terms = "Current terms.";
      const props = {
        initialUrl: URL_A,
        wave: {
          ...wave,
          competition: {
            id: "selected",
            wave_id: wave.id,
            config_version: 4,
            participation: { terms },
          },
        },
      };
      const { rerender } = render(createContent(props));
      const url = screen.getByRole("textbox", { name: "Curation URL" });
      await user.click(url);
      await user.keyboard("{Enter}");
      expect(screen.getByRole("alert")).toBeVisible();
      rerender(
        createContent({
          ...props,
          wave: {
            ...props.wave,
            competition: {
              ...props.wave.competition,
              id,
              config_version: version,
            },
          },
        })
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
      expect(checkbox).not.toHaveAttribute("aria-invalid", "true");
      expect(checkbox).toHaveAccessibleDescription(terms);
      expect(screen.queryByRole("alert")).toBeNull();
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
      rerender(createContent(props));
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    }
  );

  it("associates native terms with the version-pinned acceptance checkbox", async () => {
    const user = userEvent.setup();
    const terms = "Accept this competition’s original artwork requirements.";
    render(
      createContent({
        wave: {
          ...wave,
          competition: {
            id: "selected",
            wave_id: wave.id,
            config_version: 4,
            participation: { terms },
          },
        },
      })
    );
    const checkbox = screen.getByRole("checkbox", {
      name: "I agree to this competition’s terms.",
    });
    expect(checkbox).toHaveAccessibleDescription(terms);
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("toggles supported URLs inline in leaderboard variant without opening a new modal", async () => {
    const user = userEvent.setup();

    render(createContent({ curationComposerVariant: "leaderboard" }));

    const toggleButton = screen.getByRole("button", {
      name: "View Supported URLs",
    });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(
        "Submit one URL only. It must match one of these formats:"
      )
    ).not.toBeInTheDocument();

    await user.click(toggleButton);

    expect(
      screen.getByRole("button", { name: "Hide Supported URLs" })
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(
        "Submit one URL only. It must match one of these formats:"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("SuperRare artwork")).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /supported urls/i })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Hide Supported URLs" })
    );

    expect(
      screen.getByRole("button", { name: "View Supported URLs" })
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(
        "Submit one URL only. It must match one of these formats:"
      )
    ).not.toBeInTheDocument();
  });

  it("seeds the input from a non-null initial URL", () => {
    render(createContent({ initialUrl: URL_A }));

    expect(screen.getByLabelText("Curation URL")).toHaveValue(URL_A);
  });

  it("updates the input when initialUrl changes from one URL to another", () => {
    const { rerender } = render(createContent({ initialUrl: URL_A }));

    expect(screen.getByLabelText("Curation URL")).toHaveValue(URL_A);

    rerender(createContent({ initialUrl: URL_B }));

    expect(screen.getByLabelText("Curation URL")).toHaveValue(URL_B);
  });

  it("keeps the current input when initialUrl changes to null", async () => {
    const user = userEvent.setup();
    const { rerender } = render(createContent({ initialUrl: URL_A }));
    const input = screen.getByLabelText("Curation URL");

    await user.clear(input);
    await user.type(input, URL_B);

    rerender(createContent({ initialUrl: null }));

    expect(screen.getByLabelText("Curation URL")).toHaveValue(URL_B);
  });
});
