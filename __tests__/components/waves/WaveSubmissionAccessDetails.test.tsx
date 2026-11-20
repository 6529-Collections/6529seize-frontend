import { fireEvent, render, screen } from "@testing-library/react";
import type Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  useCompetitionDetail,
  useDefaultCompetition,
} from "@/hooks/competitions/useCompetitionQueries";
import type { ComponentProps } from "react";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import WaveSubmissionAccessDetails from "@/components/waves/WaveSubmissionAccessDetails";
import { ApiWave } from "@/generated/models/ApiWave";
import type { ApiGroup } from "@/generated/models/ApiGroup";

jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionDetail: jest.fn(),
  useDefaultCompetition: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  useQueries: () => [],
}));
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    onNavigate,
    prefetch: _prefetch,
    ...props
  }: ComponentProps<typeof Link>) => (
    <a
      href={href.toString()}
      {...props}
      onClick={(event) => {
        onNavigate?.({ preventDefault: () => event.preventDefault() });
      }}
    >
      {children}
    </a>
  ),
}));
/** Build a signed-submission fixture with the audience under test. */
function makeWave(group: ApiGroup | null = null): ApiWave {
  return Object.assign(new ApiWave(), {
    id: "wave-1",
    participation: {
      scope: { group },
      signature_required: true,
    },
  });
}

/** Select a ready competition with the submission settings under test. */
function selectCompetition(
  participation = { group_id: null as string | null, signature_required: false }
) {
  jest
    .mocked(useSearchParams)
    .mockReturnValue(
      new URLSearchParams("competition=beta") as ReturnType<
        typeof useSearchParams
      >
    );
  (useCompetitionDetail as jest.Mock).mockReturnValue({
    data: { participation },
    isPending: false,
    isError: false,
  });
}

function mockPublicGroup() {
  (useQuery as jest.Mock).mockImplementation(
    ({ queryKey }: { readonly queryKey: readonly unknown[] }) => {
      if (queryKey[0] === QueryKey.COMMUNITY_MEMBERS_TOP) {
        return { data: { count: 10_191 } };
      }
      return {
        data: {
          name: "Public Club",
          visible: true,
          is_private: false,
          group: {
            tdh: { min: 1, max: null, inclusion_strategy: "TDH" },
            rep: { min: null, max: null, user_identity: null },
            cic: { min: null, max: null, user_identity: null },
            level: { min: null, max: null },
            owns_nfts: [],
          },
        },
      };
    }
  );
}

describe("WaveSubmissionAccessDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useDefaultCompetition as jest.Mock).mockReturnValue({
      data: { competition_id: null },
      isPending: false,
      isError: false,
    });
    (useCompetitionDetail as jest.Mock).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    });
    (useQuery as jest.Mock).mockReturnValue({ data: undefined });
    jest.mocked(usePathname).mockReturnValue("/waves/wave-1");
    jest
      .mocked(useSearchParams)
      .mockReturnValue(
        new URLSearchParams() as ReturnType<typeof useSearchParams>
      );
  });

  it("keeps ended submissions compact while retaining the selected rules link", () => {
    selectCompetition({ group_id: null, signature_required: true });
    render(<WaveSubmissionAccessDetails wave={makeWave()} isClosed />);
    expect(screen.getByText("Submission group")).toBeVisible();
    expect(screen.getByText("Public", { exact: true })).toBeVisible();
    expect(
      screen.queryByText("Chat access is separate from submission access.")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Submissions require a wallet signature.")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View submission rules" })
    ).toHaveAttribute(
      "href",
      "/waves/wave-1?tab=configuration&competition=beta"
    );
  });

  it("still conceals private group metadata for ended submissions", () => {
    selectCompetition({ group_id: "private-group", signature_required: false });
    (useQuery as jest.Mock).mockReturnValue({
      data: { name: "Secret Club", visible: false, is_private: true },
    });
    render(<WaveSubmissionAccessDetails wave={makeWave()} isClosed />);
    expect(screen.getByText("Private group")).toBeVisible();
    expect(screen.queryByText("Secret Club")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("uses selected public competition access instead of the legacy group and signature", () => {
    selectCompetition();
    render(
      <WaveSubmissionAccessDetails
        wave={makeWave({
          id: "legacy-group",
          name: "Legacy Club",
          is_hidden: false,
        })}
      />
    );
    expect(useCompetitionDetail).toHaveBeenCalledWith({
      waveId: "wave-1",
      competitionId: "beta",
    });
    expect(screen.getByText("Public", { exact: true })).toBeVisible();
    expect(screen.queryByText("Legacy Club")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Submissions require a wallet signature.")
    ).not.toBeInTheDocument();
  });

  it("uses the current default competition when Chat has no explicit selection", () => {
    selectCompetition();
    jest
      .mocked(useSearchParams)
      .mockReturnValue(
        new URLSearchParams() as ReturnType<typeof useSearchParams>
      );
    (useDefaultCompetition as jest.Mock).mockReturnValue({
      data: { competition_id: "beta" },
      isPending: false,
      isError: false,
    });
    render(
      <WaveSubmissionAccessDetails
        wave={makeWave({
          id: "legacy-group",
          name: "Legacy Club",
          is_hidden: false,
        })}
      />
    );
    expect(useCompetitionDetail).toHaveBeenCalledWith({
      waveId: "wave-1",
      competitionId: "beta",
    });
    expect(screen.getByText("Public", { exact: true })).toBeVisible();
    expect(screen.queryByText("Legacy Club")).not.toBeInTheDocument();
  });

  it("waits for selected group access without announcing it as private", () => {
    selectCompetition({ group_id: "public-group", signature_required: false });
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isPending: true,
    });
    const { rerender } = render(
      <WaveSubmissionAccessDetails wave={makeWave()} />
    );
    expect(screen.getByText("Loading submission access…")).toBeVisible();
    expect(screen.queryByText("Private group")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View submission rules" })
    ).toBeVisible();
    mockPublicGroup();
    rerender(<WaveSubmissionAccessDetails wave={makeWave()} />);
    expect(
      screen.queryByText("Loading submission access…")
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "10,191 users" })).toBeVisible();
  });

  it.each([
    { isPending: true, isError: false, expected: "Loading submission access…" },
    {
      isPending: false,
      isError: true,
      expected: "Submission access details are unavailable.",
    },
  ])(
    "does not infer legacy access while the default competition is unresolved",
    ({ isPending, isError, expected }) => {
      (useDefaultCompetition as jest.Mock).mockReturnValue({
        data: undefined,
        isPending,
        isError,
      });
      render(<WaveSubmissionAccessDetails wave={makeWave()} />);
      expect(screen.getByText(expected)).toBeVisible();
      expect(
        screen.queryByText("Public", { exact: true })
      ).not.toBeInTheDocument();
      expect(useCompetitionDetail).not.toHaveBeenCalled();
    }
  );

  it("shows the selected group's count, criteria, and signing requirement", () => {
    selectCompetition({ group_id: "beta-group", signature_required: true });
    mockPublicGroup();
    const { container } = render(
      <WaveSubmissionAccessDetails wave={makeWave()} />
    );
    const countLink = screen.getByRole("link", { name: "10,191 users" });
    expect(countLink).toHaveAttribute(
      "href",
      "/network?page=1&group=beta-group"
    );
    expect(countLink).toHaveAccessibleDescription("TDH at least 1");
    expect(countLink).not.toHaveAttribute("title");
    expect(screen.getByText("TDH at least 1")).toBeVisible();
    expect(container.innerHTML).not.toContain("Public Club");
    expect(
      jest
        .mocked(useQuery)
        .mock.calls.filter(([{ queryKey }]) => queryKey[0] === QueryKey.GROUP)
    ).toHaveLength(1);
    expect(
      screen.getByText("Submissions require a wallet signature.")
    ).toBeVisible();
  });

  it.each([
    { data: { visible: true, is_private: true }, isError: false },
    { data: { visible: false, is_private: false }, isError: false },
    {
      data: { visible: true, is_private: false, is_direct_message: true },
      isError: false,
    },
    { data: undefined, isError: false },
    { data: { visible: true, is_private: false }, isError: true },
  ])(
    "withholds selected group metadata when it is private or unavailable",
    ({ data, isError }) => {
      selectCompetition({ group_id: "secret-beta", signature_required: false });
      (useQuery as jest.Mock).mockReturnValue({
        isError,
        data: data
          ? { id: "secret-beta", name: "Secret Beta Club", ...data }
          : undefined,
      });
      const { container } = render(
        <WaveSubmissionAccessDetails wave={makeWave()} />
      );
      expect(screen.getByText("Private group")).toBeVisible();
      expect(container.innerHTML).not.toContain("secret-beta");
      expect(container.innerHTML).not.toContain("Secret Beta Club");
      expect(useQuery).not.toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining([QueryKey.COMMUNITY_MEMBERS_TOP]),
        })
      );
    }
  );

  it.each([
    { isPending: true, isError: false, expected: "Loading submission access…" },
    {
      isPending: false,
      isError: true,
      expected: "Submission access details are unavailable.",
    },
  ])(
    "keeps unresolved selected competition access distinct from public access",
    ({ isPending, isError, expected }) => {
      selectCompetition();
      (useCompetitionDetail as jest.Mock).mockReturnValue({
        data: undefined,
        isPending,
        isError,
      });
      render(<WaveSubmissionAccessDetails wave={makeWave()} />);
      expect(screen.getByText(expected)).toBeVisible();
      expect(
        screen.queryByText("Public", { exact: true })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "View submission rules" })
      ).toBeVisible();
    }
  );

  it("uses wave access after confirming there is no default competition", () => {
    mockPublicGroup();
    render(
      <WaveSubmissionAccessDetails
        wave={makeWave({
          id: "legacy-group",
          is_hidden: false,
        })}
      />
    );
    expect(useCompetitionDetail).not.toHaveBeenCalled();
    expect(useDefaultCompetition).toHaveBeenCalledWith("wave-1", true);
    expect(screen.getByRole("link", { name: "10,191 users" })).toHaveAttribute(
      "href",
      "/network?page=1&group=legacy-group"
    );
  });

  it.each([
    {
      pathname: "/waves/wave-1",
      query: "competition=beta",
      expected: "&competition=beta",
    },
    {
      pathname: "/waves/wave-1/decisions/beta",
      query: "competition=alpha",
      expected: "&competition=beta",
    },
    {
      pathname: "/my-stream",
      query: "wave=wave-1&competition=beta",
      expected: "&competition=beta",
    },
    {
      pathname: "/waves/wave-1",
      query: "competition=beta%20%2F1",
      expected: "&competition=beta+%2F1",
    },
    { pathname: "/waves/wave-2", query: "competition=beta", expected: "" },
  ])(
    "preserves only this Wave's selected competition in the real href: $pathname $query",
    ({ pathname, query, expected }) => {
      jest.mocked(usePathname).mockReturnValue(pathname);
      jest
        .mocked(useSearchParams)
        .mockReturnValue(
          new URLSearchParams(query) as ReturnType<typeof useSearchParams>
        );
      render(<WaveSubmissionAccessDetails wave={makeWave()} />);
      expect(
        screen.getByRole("link", { name: "View submission rules" })
      ).toHaveAttribute("href", `/waves/wave-1?tab=configuration${expected}`);
    }
  );

  it("links inspectable submission groups and uses existing rules navigation", () => {
    const onViewRules = jest.fn();
    mockPublicGroup();
    const { container } = render(
      <WaveSubmissionAccessDetails
        wave={makeWave({
          id: "group /1",
          name: "Submission Club",
          is_hidden: false,
        })}
        onViewRules={onViewRules}
      />
    );
    expect(screen.getByRole("link", { name: "10,191 users" })).toHaveAttribute(
      "href",
      "/network?page=1&group=group%20%2F1"
    );
    expect(container.innerHTML).not.toContain("Submission Club");
    const rules = screen.getByRole("link", { name: "View submission rules" });
    expect(rules).toHaveAttribute("href", "/waves/wave-1?tab=configuration");
    fireEvent.click(rules);
    expect(onViewRules).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText("Chat access is separate from submission access.")
    ).toBeVisible();
    expect(
      screen.getByText("Submissions require a wallet signature.")
    ).toBeVisible();
  });

  it.each([
    { id: "secret-group", name: "Secret group name", is_hidden: true },
    {
      id: "secret-group",
      name: "Secret group name",
      is_hidden: false,
      is_direct_message: true,
    },
  ])(
    "withholds identifying metadata for private submission groups",
    (group) => {
      const { container } = render(
        <WaveSubmissionAccessDetails wave={makeWave(group)} />
      );
      expect(screen.getByText("Private group")).toBeVisible();
      expect(container.innerHTML).not.toContain("secret-group");
      expect(container.innerHTML).not.toContain("Secret group name");
      expect(screen.getAllByRole("link")).toHaveLength(1);
    }
  );

  it("does not describe an incomplete restricted group as public", () => {
    render(
      <WaveSubmissionAccessDetails
        wave={makeWave({ id: "", name: "Submission Club", is_hidden: false })}
      />
    );
    expect(screen.getByText("Group unavailable")).toBeVisible();
    expect(
      screen.queryByText("Public", { exact: true })
    ).not.toBeInTheDocument();
  });

  it("uses the current group visibility when legacy wave access is stale", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { name: "Legacy Club", visible: true, is_private: true },
    });
    render(
      <WaveSubmissionAccessDetails
        wave={makeWave({ id: "legacy-group", is_hidden: false })}
      />
    );
    expect(screen.getByText("Private group")).toBeVisible();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(useQuery).not.toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining([QueryKey.COMMUNITY_MEMBERS_TOP]),
      })
    );
  });

  it("does not imply that public group access overrides submission rules", () => {
    render(<WaveSubmissionAccessDetails wave={makeWave()} />);
    expect(screen.getByText("Public", { exact: true })).toBeVisible();
    expect(
      screen.getByText("Other submission rules still apply.")
    ).toBeVisible();
  });
});
