interface GithubResourceBase {
  readonly href: string;
  readonly owner: string;
  readonly repo: string;
}

export interface GithubRepositoryResource extends GithubResourceBase {
  readonly kind: "repository";
}

export interface GithubIssueResource extends GithubResourceBase {
  readonly kind: "issue";
  readonly number: number;
}

export interface GithubPullResource extends GithubResourceBase {
  readonly kind: "pull";
  readonly number: number;
}

export interface GithubContentResource extends GithubResourceBase {
  readonly kind: "content";
  readonly mode: "blob" | "tree";
  readonly segments: readonly string[];
  readonly lineStart: number | null;
  readonly lineEnd: number | null;
}

export interface GithubCommitResource extends GithubResourceBase {
  readonly kind: "commit";
  readonly ref: string;
}

export interface GithubReleaseResource extends GithubResourceBase {
  readonly kind: "release";
  readonly tag: string | null;
}

export interface GithubActionsResource extends GithubResourceBase {
  readonly kind: "actions";
  readonly runId: number | null;
  readonly workflowId: string | null;
}

export interface GithubDiscussionResource extends GithubResourceBase {
  readonly kind: "discussion";
  readonly number: number | null;
}

export type GithubResource =
  | GithubRepositoryResource
  | GithubIssueResource
  | GithubPullResource
  | GithubContentResource
  | GithubCommitResource
  | GithubReleaseResource
  | GithubActionsResource
  | GithubDiscussionResource;

export interface GithubIssueApiResponse {
  readonly html_url?: string | null;
  readonly title?: string | null;
  readonly state?: string | null;
  readonly state_reason?: string | null;
  readonly user?: { readonly login?: string | null } | null;
  readonly created_at?: string | null;
  readonly updated_at?: string | null;
  readonly closed_at?: string | null;
  readonly comments?: number | null;
  readonly labels?:
    | readonly {
        readonly name?: string | null;
        readonly color?: string | null;
      }[]
    | null
    | undefined;
  readonly assignee?: { readonly login?: string | null } | null;
  readonly assignees?:
    | readonly { readonly login?: string | null }[]
    | null
    | undefined;
  readonly pull_request?: unknown;
}

export interface GithubPullApiResponse {
  readonly html_url?: string | null;
  readonly title?: string | null;
  readonly state?: string | null;
  readonly merged?: boolean | null;
  readonly draft?: boolean | null;
  readonly mergeable_state?: string | null;
  readonly issue_url?: string | null;
  readonly user?: { readonly login?: string | null } | null;
  readonly created_at?: string | null;
  readonly updated_at?: string | null;
  readonly closed_at?: string | null;
  readonly comments?: number | null;
  readonly review_comments?: number | null;
  readonly commits?: number | null;
  readonly additions?: number | null;
  readonly deletions?: number | null;
  readonly changed_files?: number | null;
  readonly base?:
    | {
        readonly ref?: string | null;
      }
    | null
    | undefined;
  readonly head?:
    | {
        readonly ref?: string | null;
        readonly sha?: string | null;
      }
    | null
    | undefined;
}

export interface GithubPullReviewApiResponse {
  readonly id?: number | null;
  readonly user?: { readonly login?: string | null } | null;
  readonly state?: string | null;
  readonly submitted_at?: string | null;
}

export interface GithubRepositoryApiResponse {
  readonly full_name?: string | null;
  readonly description?: string | null;
  readonly default_branch?: string | null;
  readonly language?: string | null;
  readonly stargazers_count?: number | null;
  readonly forks_count?: number | null;
  readonly open_issues_count?: number | null;
  readonly visibility?: string | null;
  readonly private?: boolean | null;
  readonly archived?: boolean | null;
  readonly updated_at?: string | null;
  readonly pushed_at?: string | null;
  readonly topics?: readonly string[] | null;
  readonly license?: { readonly spdx_id?: string | null } | null;
  readonly html_url?: string | null;
}

export interface GithubContentApiItem {
  readonly type?: string | null;
  readonly name?: string | null;
  readonly path?: string | null;
  readonly html_url?: string | null;
  readonly size?: number | null;
  readonly content?: string | null;
  readonly encoding?: string | null;
}

export type GithubContentApiResponse =
  | GithubContentApiItem
  | readonly GithubContentApiItem[];

export interface GithubCommitApiResponse {
  readonly html_url?: string | null;
  readonly sha?: string | null;
  readonly commit?: {
    readonly message?: string | null;
    readonly author?: {
      readonly name?: string | null;
      readonly date?: string | null;
    } | null;
    readonly committer?: {
      readonly name?: string | null;
      readonly date?: string | null;
    } | null;
  } | null;
  readonly author?: { readonly login?: string | null } | null;
  readonly committer?: { readonly login?: string | null } | null;
  readonly stats?:
    | {
        readonly additions?: number | null;
        readonly deletions?: number | null;
      }
    | null
    | undefined;
  readonly files?: readonly unknown[] | null;
}

export interface GithubCombinedStatusApiResponse {
  readonly state?: string | null;
  readonly total_count?: number | null;
  readonly target_url?: string | null;
  readonly statuses?: readonly unknown[] | null;
}

export interface GithubCheckRunApiResponse {
  readonly status?: string | null;
  readonly conclusion?: string | null;
  readonly html_url?: string | null;
}

export interface GithubCheckRunsApiResponse {
  readonly total_count?: number | null;
  readonly check_runs?: readonly GithubCheckRunApiResponse[] | null;
}

export interface GithubReleaseApiResponse {
  readonly html_url?: string | null;
  readonly name?: string | null;
  readonly tag_name?: string | null;
  readonly draft?: boolean | null;
  readonly prerelease?: boolean | null;
  readonly published_at?: string | null;
}

export interface GithubActionsRunApiResponse {
  readonly html_url?: string | null;
  readonly name?: string | null;
  readonly display_title?: string | null;
  readonly status?: string | null;
  readonly conclusion?: string | null;
  readonly run_number?: number | null;
  readonly event?: string | null;
}

export interface GithubActionsRunsApiResponse {
  readonly workflow_runs?: readonly GithubActionsRunApiResponse[] | null;
}

export interface GithubWorkflowApiResponse {
  readonly html_url?: string | null;
  readonly name?: string | null;
  readonly path?: string | null;
  readonly state?: string | null;
}

export interface GithubDiscussionGraphqlNode {
  readonly title?: string | null;
  readonly url?: string | null;
  readonly number?: number | null;
  readonly closed?: boolean | null;
  readonly answerChosenAt?: string | null;
  readonly category?: { readonly name?: string | null } | null;
  readonly comments?: { readonly totalCount?: number | null } | null;
}

export interface GithubDiscussionGraphqlData {
  readonly repository?: {
    readonly discussion?: GithubDiscussionGraphqlNode | null;
    readonly discussions?: {
      readonly totalCount?: number | null;
      readonly nodes?: readonly GithubDiscussionGraphqlNode[] | null;
    } | null;
  } | null;
}

export interface GithubGraphqlResponse<T> {
  readonly data?: T | null;
  readonly errors?:
    | readonly { readonly message?: string | null }[]
    | null
    | undefined;
}

export type GithubReviewApiState =
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "DISMISSED";
