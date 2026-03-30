"use client";

const getMemesQuickVoteErrorStatus = (error: Error): number | null => {
  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }

  if (!("response" in error)) {
    return null;
  }

  const response = error.response;

  if (
    typeof response !== "object" ||
    response === null ||
    !("status" in response) ||
    typeof response.status !== "number"
  ) {
    return null;
  }

  return response.status;
};

export const isMemesQuickVoteMissingDropError = (error: unknown): boolean => {
  if (typeof error === "string") {
    const normalized = error.toLowerCase();
    return normalized.includes("not found") || normalized.includes("404");
  }

  if (!(error instanceof Error)) {
    return false;
  }

  if (getMemesQuickVoteErrorStatus(error) === 404) {
    return true;
  }

  const normalizedMessage = error.message.toLowerCase();
  return (
    normalizedMessage.includes("not found") || normalizedMessage.includes("404")
  );
};
