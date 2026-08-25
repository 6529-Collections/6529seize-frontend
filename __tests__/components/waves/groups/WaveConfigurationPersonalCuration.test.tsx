import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveConfigurationPersonalCuration from "@/components/waves/groups/WaveConfigurationPersonalCuration";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";

const replace = jest.fn();
let searchParams = new URLSearchParams("view=chat");

jest.mock("next/navigation", () => ({
  usePathname: () => "/waves/wave-id",
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));
jest.mock("@/hooks/waves/useWaveCurations", () => ({
  useWaveCurations: jest.fn(),
}));

const mockUseWaveCurations = useWaveCurations as jest.MockedFunction<
  typeof useWaveCurations
>;
const curations = [
  {
    id: "curation-1",
    name: "Curators' choice",
    group_id: "group-1",
    priority_order: 1,
    created_at: 1,
  },
];

describe("WaveConfigurationPersonalCuration", () => {
  beforeEach(() => {
    replace.mockReset();
    searchParams = new URLSearchParams("view=chat");
    mockUseWaveCurations.mockReset();
  });

  it("stays hidden when no curation can be selected", () => {
    mockUseWaveCurations.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as any);

    render(
      <WaveConfigurationPersonalCuration wave={{ id: "wave-id" } as any} />
    );

    expect(
      screen.queryByRole("heading", { name: "Your curation view" })
    ).not.toBeInTheDocument();
  });

  it("explains that selecting a curation only changes the viewer's view", async () => {
    const user = userEvent.setup();
    mockUseWaveCurations.mockReturnValue({
      data: curations,
      isPending: false,
      isError: false,
    } as any);

    render(
      <WaveConfigurationPersonalCuration wave={{ id: "wave-id" } as any} />
    );

    expect(
      screen.getByRole("heading", { name: "Your curation view" })
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Curation" })).toHaveValue("");

    await user.hover(
      screen.getByRole("button", { name: "About your curation view" })
    );
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "This setting only changes which curation you see. It does not affect what other people see."
    );
  });

  it("preserves other query parameters when selecting a curation", async () => {
    const user = userEvent.setup();
    mockUseWaveCurations.mockReturnValue({
      data: curations,
      isPending: false,
      isError: false,
    } as any);

    render(
      <WaveConfigurationPersonalCuration wave={{ id: "wave-id" } as any} />
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Curation" }),
      "curation-1"
    );

    expect(replace).toHaveBeenCalledWith(
      "/waves/wave-id?view=chat&curation=curation-1",
      { scroll: false }
    );
  });

  it("removes an unavailable selected curation while preserving other query parameters", async () => {
    searchParams = new URLSearchParams(
      "view=chat&curation=missing-curation&filter=active"
    );
    mockUseWaveCurations.mockReturnValue({
      data: curations,
      isPending: false,
      isError: false,
    } as any);

    render(
      <WaveConfigurationPersonalCuration wave={{ id: "wave-id" } as any} />
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/waves/wave-id?view=chat&filter=active",
        { scroll: false }
      )
    );
  });
});
