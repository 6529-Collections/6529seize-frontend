import Cookies from "js-cookie";
import { DISTRIBUTION_PLAN_COOKIE } from "../constants";
import { AllowlistToolResponse } from "../components/allowlist-tool/allowlist-tool.types";
import { makeErrorToast } from "./distribution-plan.utils";

export async function distributionPlanApiFetch<T>(endpoint: string): Promise<{
  readonly success: boolean;
  readonly data: T | null;
}> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const auth = Cookies.get(DISTRIBUTION_PLAN_COOKIE);
  if (auth) {
    headers["Authorization"] = `Bearer ${auth}`;
  }
  try {
    const res = await fetch(
      `${process.env.ALLOWLIST_API_ENDPOINT}${endpoint}`,
      {
        headers,
      }
    );

    if (res.status === 401) {
      Cookies.remove(DISTRIBUTION_PLAN_COOKIE);
      makeErrorToast("Unauthorized");
      return {
        success: false,
        data: null,
      };
    }

    const data: AllowlistToolResponse<T> = await res.json();

    if (!data) {
      makeErrorToast("Something went wrong, try again");
      return {
        success: false,
        data: null,
      };
    }

    if (typeof data === "object" && "error" in data) {
      makeErrorToast(data.error);
      return {
        success: false,
        data: null,
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    makeErrorToast("Something went wrong, try again");
    return {
      success: false,
      data: null,
    };
  }
}

export const distributionPlanApiPost = async <T>({
  endpoint,
  body,
}: {
  endpoint: string;
  body: Record<string, unknown>;
}): Promise<{
  readonly success: boolean;
  readonly data: T | null;
}> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const auth = Cookies.get(DISTRIBUTION_PLAN_COOKIE);
  if (auth) {
    headers["Authorization"] = `Bearer ${auth}`;
  }
  try {
    const res = await fetch(
      `${process.env.ALLOWLIST_API_ENDPOINT}${endpoint}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    if (res.status === 401) {
      Cookies.remove(DISTRIBUTION_PLAN_COOKIE);
      makeErrorToast("Unauthorized");
      return {
        success: false,
        data: null,
      };
    }

    const data: AllowlistToolResponse<T> = await res.json();

    if (data && typeof data === "object" && "error" in data) {
      makeErrorToast(data.error);
      return {
        success: false,
        data: null,
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    makeErrorToast("Something went wrong, try again");
    return {
      success: false,
      data: null,
    };
  }
};

export const setDistributionPlanCookie = (token: string) => {
  Cookies.set(DISTRIBUTION_PLAN_COOKIE, token);
};

export const removeDistributionPlanCookie = () => {
  Cookies.remove(DISTRIBUTION_PLAN_COOKIE);
};
