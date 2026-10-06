import { fireEvent, render, screen } from "@testing-library/react";
import type Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  useCompetitionDetail,
  useDefaultCompetition,
} from "@/hooks/competitions/useCompetitionQueries";
import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import type { ComponentProps } from "react";
import WaveSubmissionAccessDetails from "@/components/waves/WaveSubmissionAccessDetails";
import { ApiWave } from "@/generated/models/ApiWave";
import type { ApiGroup } from "@/generated/models/ApiGroup";

jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionDetail: jest.fn(),
  useDefaultCompetition: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));
jest.mock("@/helpers/competition.helpers", () => ({
  ...jest.requireActual("@/helpers/competition.helpers"),
  isMultiCompetitionEnabled: jest.fn(),
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
jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (uri: string) => uri,
  ImageScale: { W_AUTO_H_50: "50" },
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

describe("WaveSubmissionAccessDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isMultiCompetitionEnabled).mockReturnValue(true);
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
    expect(
      screen.getByText("Public. Other submission rules still apply.")
    ).toBeVisible();
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
    expect(
      screen.getByText("Public. Other submission rules still apply.")
    ).toBeVisible();
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
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        name: "Public Club",
        visible: true,
        is_private: false,
        is_direct_message: false,
      },
      isPending: false,
    });
    rerender(<WaveSubmissionAccessDetails wave={makeWave()} />);
    expect(
      screen.queryByText("Loading submission access…")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Inspect Public Club group criteria and members",
      })
    ).toBeVisible();
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
        screen.queryByText("Public. Other submission rules still apply.")
      ).not.toBeInTheDocument();
      expect(useCompetitionDetail).not.toHaveBeenCalled();
    }
  );

  it("shows an inspectable selected group and its signing requirement", () => {
    selectCompetition({ group_id: "beta-group", signature_required: true });
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: "beta-group",
        name: "Beta Club",
        visible: true,
        is_private: false,
      },
    });
    render(<WaveSubmissionAccessDetails wave={makeWave()} />);
    expect(
      screen.getByRole("link", {
        name: "Inspect Beta Club group criteria and members",
      })
    ).toHaveAttribute("href", "/network?page=1&group=beta-group");
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
        screen.queryByText("Public. Other submission rules still apply.")
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "View submission rules" })
      ).toBeVisible();
    }
  );

  it("uses legacy access without competition requests when the feature is disabled", () => {
    jest.mocked(isMultiCompetitionEnabled).mockReturnValue(false);
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
    expect(useCompetitionDetail).not.toHaveBeenCalled();
    expect(useDefaultCompetition).not.toHaveBeenCalled();
    expect(
      screen.getByRole("link", {
        name: "Inspect Legacy Club group criteria and members",
      })
    ).toBeVisible();
  });

  it.each([
    {
      pathname: "/waves/wave-1",
      query: "competition=beta",
      expected: "&competition=beta",
    },
    {
      pathname: "/waves/wave-1/competitions/beta",
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
    render(
      <WaveSubmissionAccessDetails
        wave={makeWave({
          id: "group /1",
          name: "Submission Club",
          is_hidden: false,
        })}
        onViewRules={onViewRules}
      />
    );
    expect(
      screen.getByRole("link", {
        name: "Inspect Submission Club group criteria and members",
      })
    ).toHaveAttribute("href", "/network?page=1&group=group%20%2F1");
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
        wave={makeWave({ id: "missing-name", is_hidden: false })}
      />
    );
    expect(screen.getByText("Group unavailable")).toBeVisible();
    expect(screen.queryByText(/Public\./)).not.toBeInTheDocument();
  });

  it("does not imply that public group access overrides submission rules", () => {
    render(<WaveSubmissionAccessDetails wave={makeWave()} />);
    expect(
      screen.getByText("Public. Other submission rules still apply.")
    ).toBeVisible();
  });
});
