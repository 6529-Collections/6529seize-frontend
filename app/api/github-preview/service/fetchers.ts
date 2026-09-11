import { serverEnv } from "@/config/serverEnv";
import type { GithubGraphqlResponse } from "./types";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_GRAPHQL_URL = `${GITHUB_API_BASE}/graphql`;
const FETCH_TIMEOUT_MS = 5000;
const TOKEN_CHECK_TTL_MS = 2 * 60 * 1000;

let publicTokenCheck:
  | {
      readonly token: string;
      readonly expiresAt: number;
      readonly result: Promise<boolean>;
    }
  | undefined;

class GithubApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

const createAbortController = (): {
  readonly controller: AbortController;
  readonly cancel: () => void;
} => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  return {
    controller,
    cancel: () => clearTimeout(timeout),
  };
};

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

const toGithubRequestError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error("GitHub request failed.");
};

export const isGithubApiNotFoundError = (
  error: unknown
): error is GithubApiError =>
  error instanceof GithubApiError && error.status === 404;

const restHeaders = (githubToken?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "user-agent": "6529seize-github-preview/1.0",
  };

  if (githubToken) {
    headers["Authorization"] = `Bearer ${githubToken}`;
  }

  return headers;
};

// GitHub documents classic tokens with no scopes as read-only public access.
// A missing header is not proof: fine-grained and GitHub App tokens use other
// permission models, and even public_repo permits non-public draft releases.
const hasNoOauthScopes = (response: Response): boolean =>
  response.headers.get("x-oauth-scopes")?.trim() === "";

const checkPublicToken = async (githubToken: string): Promise<boolean> => {
  const { controller, cancel } = createAbortController();
  try {
    const response = await fetch(`${GITHUB_API_BASE}/rate_limit`, {
      headers: restHeaders(githubToken),
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });
    const eligible = response.ok && hasNoOauthScopes(response);
    await response.body?.cancel();
    return eligible;
  } catch {
    return false;
  } finally {
    cancel();
  }
};

const getPublicRestToken = async (): Promise<string | undefined> => {
  const githubToken = serverEnv?.GITHUB_LINK_STATUS_PREVIEW_TOKEN;
  if (!githubToken?.startsWith("ghp_")) {
    return undefined;
  }

  if (
    publicTokenCheck?.token !== githubToken ||
    publicTokenCheck.expiresAt <= Date.now()
  ) {
    publicTokenCheck = {
      token: githubToken,
      expiresAt: Date.now() + TOKEN_CHECK_TTL_MS,
      result: checkPublicToken(githubToken),
    };
  }

  return (await publicTokenCheck.result) ? githubToken : undefined;
};

export const fetchGithubJson = async <T>(path: string): Promise<T> => {
  const githubToken = await getPublicRestToken();
  const { controller, cancel } = createAbortController();

  try {
    let response = await fetch(`${GITHUB_API_BASE}${path}`, {
      headers: restHeaders(githubToken),
      signal: controller.signal,
      cache: "no-store",
    });

    // Scopes can change after the eligibility probe. Never parse or cache an
    // authenticated resource body without checking that same response's scopes.
    if (githubToken && !hasNoOauthScopes(response)) {
      await response.body?.cancel();
      publicTokenCheck = undefined;
      response = await fetch(`${GITHUB_API_BASE}${path}`, {
        headers: restHeaders(),
        signal: controller.signal,
        cache: "no-store",
      });
    }

    if (!response.ok) {
      throw new GithubApiError(
        `GitHub request failed with status ${response.status}.`,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error("GitHub request timed out.");
    }

    throw toGithubRequestError(error);
  } finally {
    cancel();
  }
};

export const fetchGithubGraphql = async <T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> => {
  const githubToken = serverEnv?.GITHUB_LINK_STATUS_PREVIEW_TOKEN;
  if (!githubToken) {
    throw new Error("GitHub discussion preview metadata is unavailable.");
  }

  const { controller, cancel } = createAbortController();

  try {
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubToken}`,
        "content-type": "application/json",
        "user-agent": "6529seize-github-preview/1.0",
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });

    if (!response.ok) {
      throw new GithubApiError(
        `GitHub GraphQL request failed with status ${response.status}.`,
        response.status
      );
    }

    const body = (await response.json()) as GithubGraphqlResponse<T>;
    const [firstError] = body.errors ?? [];
    if (firstError) {
      throw new Error("GitHub GraphQL request failed.");
    }

    if (!body.data) {
      throw new Error("GitHub GraphQL response did not include data.");
    }

    return body.data;
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error("GitHub request timed out.");
    }

    throw toGithubRequestError(error);
  } finally {
    cancel();
  }
};
