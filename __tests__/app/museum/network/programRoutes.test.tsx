import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import MuseumProgramDetailPage from "@/app/museum/network/programs/[programId]/page";
import { getMuseumView } from "@/lib/museum/normalize";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import type {
  MuseumProgram,
  MuseumProgramMedia,
  MuseumView,
} from "@/lib/museum/types";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    readonly children: ReactNode;
    readonly prefetch?: boolean;
  }) => <a {...props}>{children}</a>,
}));

jest.mock("@/lib/museum/normalize", () => ({
  getMuseumView: jest.fn(),
}));

jest.mock("@/lib/museum/publication/runtime", () => ({
  getMuseumPublicationState: jest.fn(),
}));

const mockedMuseumView = jest.mocked(getMuseumView);
const mockedPublicationState = jest.mocked(getMuseumPublicationState);

const media: MuseumProgramMedia = {
  sourceUrl: "https://cdn.example.test/submitted.jpg",
  sourceMimeType: "image/jpeg",
  sourceSha256: `sha256:${"a".repeat(64)}`,
  sourceByteSize: 120000,
  sourceWidth: 1200,
  sourceHeight: 800,
  altText: "A figure at a gate.",
  altTextStatus: "reviewed",
  variants: [
    {
      url: "https://cdn.example.test/presentation-640.webp",
      width: 640,
      height: 427,
      mimeType: "image/webp",
      sha256: `sha256:${"b".repeat(64)}`,
      byteSize: 32000,
    },
  ],
};

function program(programId: string): MuseumProgram {
  return {
    programId,
    title: programId === "6529NM-AP-01" ? "Keys and Gates" : "Other program",
    subtitle: "A Museum program",
    status: "selected_unminted",
    statusAsOf: "2026-08-01T00:00:00Z",
    curatorialFrame: "A curatorial frame.",
    rules: [],
    nonClaims: [],
    selectedWorks: [
      {
        recordId: `${programId}-OUT-001`,
        outcomePath: "records/outcome.json",
        status: "selected_unminted",
        artist: "An artist",
        title: "A selected work",
        submissionDropId: null,
        winnerPlace: 1,
        voteTotal: 100,
        voterCount: 10,
        media,
      },
    ],
    sourcePath: "records/program.json",
    selectedWorksPath: "records/selected.json",
  };
}

function viewFor(selectedProgram: MuseumProgram): MuseumView {
  return {
    sourceState: "fresh",
    release: null,
    mission: null,
    policies: [],
    methodology: [],
    governance: [],
    approvedCollections: [],
    programs: [selectedProgram],
    accessions: [],
    objects: [],
  };
}

describe("Museum program routes", () => {
  beforeEach(() => {
    mockedPublicationState.mockResolvedValue({
      status: "unavailable",
      publication: null,
      errorCode: "test_publication_unavailable",
      failedAt: "2026-08-01T00:00:00Z",
      lastValidAcceptedAt: null,
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("keeps the Keys and Gates winner grid text-only", async () => {
    mockedMuseumView.mockResolvedValue(viewFor(program("6529NM-AP-01")));

    render(
      await MuseumProgramDetailPage({
        params: Promise.resolve({ programId: "6529NM-AP-01" }),
      })
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Keys and Gates" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "A selected work" })
    ).toHaveAttribute("href", "/museum/network/objects/6529NM-AP-01-OUT-001");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByText(/submitted images remain off this public view/u)
    ).toBeInTheDocument();
  });

  it("keeps presentation media for other Museum programs", async () => {
    mockedMuseumView.mockResolvedValue(viewFor(program("6529NM-AP-02")));

    render(
      await MuseumProgramDetailPage({
        params: Promise.resolve({ programId: "6529NM-AP-02" }),
      })
    );

    expect(
      screen.getByRole("img", { name: "A figure at a gate." })
    ).toHaveAttribute("src", "https://cdn.example.test/presentation-640.webp");
  });
});
