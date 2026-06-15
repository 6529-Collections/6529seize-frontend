import {
  backendReportMarkdown,
  frontendReportMarkdown,
  reviewbotReportMarkdown,
  safeAppReportMarkdown,
  streamReportMarkdown,
} from "./reportContent";

export const FOLLOW_THE_REPO_WAVE_URL =
  "https://6529.io/waves/49f0e595-ec7c-4235-8695-a527f61b69f4";

export type TechReportRepoKey =
  | "frontend"
  | "backend"
  | "stream"
  | "safeApp"
  | "reviewbot";

type TechReportRepo = {
  readonly key: TechReportRepoKey;
  readonly name: string;
  readonly repoFullName: string;
  readonly githubUrl: string;
  readonly prCount: number;
  readonly stateSummary: string;
  readonly focus: string;
  readonly content: string;
};

type TechWeeklyPrReport = {
  readonly slug: string;
  readonly title: string;
  readonly dateLabel: string;
  readonly publishedAt: string;
  readonly description: string;
  readonly repos: readonly TechReportRepo[];
};

export const TECH_WEEKLY_PR_REPORT = {
  slug: "punk6529-prs-2026-06-08-2026-06-15",
  title: "punk6529 PRs, June 8-15 2026",
  dateLabel: "June 8-15, 2026",
  publishedAt: "2026-06-15",
  description:
    "A repo-by-repo weekly digest of punk6529 pull requests across the tracked 6529 technical repositories.",
  repos: [
    {
      key: "frontend",
      name: "6529seize-frontend",
      repoFullName: "6529-Collections/6529seize-frontend",
      githubUrl: "https://github.com/6529-Collections/6529seize-frontend",
      prCount: 78,
      stateSummary: "55 open, 22 merged, 1 closed",
      focus: "App security, SEO, WCAG/i18n, review bot config",
      content: frontendReportMarkdown,
    },
    {
      key: "backend",
      name: "6529seize-backend",
      repoFullName: "6529-Collections/6529seize-backend",
      githubUrl: "https://github.com/6529-Collections/6529seize-backend",
      prCount: 4,
      stateSummary: "2 open, 2 merged",
      focus: "Wallet auth session APIs and media resolver support",
      content: backendReportMarkdown,
    },
    {
      key: "stream",
      name: "6529Stream",
      repoFullName: "6529-Collections/6529Stream",
      githubUrl: "https://github.com/6529-Collections/6529Stream",
      prCount: 188,
      stateSummary: "181 merged, 7 open",
      focus: "Contract hardening, release gates, protocol evidence",
      content: streamReportMarkdown,
    },
    {
      key: "safeApp",
      name: "6529-safe-app",
      repoFullName: "6529-Collections/6529-safe-app",
      githubUrl: "https://github.com/6529-Collections/6529-safe-app",
      prCount: 77,
      stateSummary: "76 merged, 1 open",
      focus: "Safe app security posture, release evidence, test gates",
      content: safeAppReportMarkdown,
    },
    {
      key: "reviewbot",
      name: "6529reviewbot",
      repoFullName: "6529-Collections/6529reviewbot",
      githubUrl: "https://github.com/6529-Collections/6529reviewbot",
      prCount: 349,
      stateSummary: "all merged",
      focus: "Standalone GitHub App launch, budgets, dogfood, hotfixes",
      content: reviewbotReportMarkdown,
    },
  ],
} as const satisfies TechWeeklyPrReport;

export const TECH_WEEKLY_PR_TOTAL = TECH_WEEKLY_PR_REPORT.repos.reduce(
  (total, repo) => total + repo.prCount,
  0
);
