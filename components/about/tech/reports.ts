import {
  backendReportMarkdown,
  frontendReportMarkdown,
  reviewbotReportMarkdown,
  safeAppReportMarkdown,
  streamReportMarkdown,
} from "./reportContent";
import {
  currentBackendReportMarkdown,
  currentFrontendReportMarkdown,
  currentReviewbotReportMarkdown,
  currentSafeAppReportMarkdown,
  currentStreamReportMarkdown,
} from "./currentReportContent";

export const FOLLOW_THE_REPO_WAVE_URL =
  "https://6529.io/waves/49f0e595-ec7c-4235-8695-a527f61b69f4";

type TechReportRepoKey =
  | "frontend"
  | "backend"
  | "stream"
  | "safeApp"
  | "reviewbot";

export type TechReportRepo = {
  readonly key: TechReportRepoKey;
  readonly name: string;
  readonly repoFullName: string;
  readonly githubUrl: string;
  readonly prCount: number;
  readonly stateSummary: string;
  readonly focus: string;
  readonly content: string;
};

export type TechWeeklyPrReport = {
  readonly slug: string;
  readonly title: string;
  readonly dateLabel: string;
  readonly publishedAt: string;
  readonly description: string;
  readonly repos: readonly TechReportRepo[];
};

export const TECH_WEEKLY_PR_REPORT = {
  slug: "punk6529-prs-2026-06-15-2026-06-17",
  title: "punk6529 PRs, June 15-17 2026",
  dateLabel: "June 15-17, 2026",
  publishedAt: "2026-06-17",
  description:
    "A repo-by-repo digest of punk6529 pull requests since the June 15 report across the tracked 6529 technical repositories.",
  repos: [
    {
      key: "frontend",
      name: "6529seize-frontend",
      repoFullName: "6529-Collections/6529seize-frontend",
      githubUrl: "https://github.com/6529-Collections/6529seize-frontend",
      prCount: 35,
      stateSummary: "31 merged, 4 open",
      focus:
        "Reviewbot metrics, first-party and GitHub previews, Wave REP, delegation docs, profile CMS, build/deploy ops",
      content: currentFrontendReportMarkdown,
    },
    {
      key: "backend",
      name: "6529seize-backend",
      repoFullName: "6529-Collections/6529seize-backend",
      githubUrl: "https://github.com/6529-Collections/6529seize-backend",
      prCount: 7,
      stateSummary: "5 merged, 2 open",
      focus:
        "Wave REP and Wave Score backend, v2 wave read contracts, profile CMS persistence, deploy workflow maintenance",
      content: currentBackendReportMarkdown,
    },
    {
      key: "stream",
      name: "6529Stream",
      repoFullName: "6529-Collections/6529Stream",
      githubUrl: "https://github.com/6529-Collections/6529Stream",
      prCount: 70,
      stateSummary: "70 merged",
      focus:
        "Release evidence, integration handoff, metadata/provenance, bytecode discipline, protocol tests, monitoring",
      content: currentStreamReportMarkdown,
    },
    {
      key: "safeApp",
      name: "6529-safe-app",
      repoFullName: "6529-Collections/6529-safe-app",
      githubUrl: "https://github.com/6529-Collections/6529-safe-app",
      prCount: 62,
      stateSummary: "62 merged",
      focus:
        "Safe write-flow modularization, release gates, supply-chain hardening, WCAG/i18n, OSS readiness",
      content: currentSafeAppReportMarkdown,
    },
    {
      key: "reviewbot",
      name: "6529reviewbot",
      repoFullName: "6529-Collections/6529reviewbot",
      githubUrl: "https://github.com/6529-Collections/6529reviewbot",
      prCount: 22,
      stateSummary: "all merged",
      focus:
        "Production dogfood hardening, webhook and admin reliability, larger-PR capacity, responsiveness reviews",
      content: currentReviewbotReportMarkdown,
    },
  ],
} as const satisfies TechWeeklyPrReport;

const PREVIOUS_TECH_WEEKLY_PR_REPORT = {
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

export const TECH_PR_REPORTS = [
  TECH_WEEKLY_PR_REPORT,
  PREVIOUS_TECH_WEEKLY_PR_REPORT,
] as const satisfies readonly TechWeeklyPrReport[];

export function getTechReportBySlug(
  reportSlug: string
): TechWeeklyPrReport | undefined {
  return TECH_PR_REPORTS.find((report) => report.slug === reportSlug);
}

export function getTechReportTotal(report: TechWeeklyPrReport): number {
  return report.repos.reduce((total, repo) => total + repo.prCount, 0);
}
