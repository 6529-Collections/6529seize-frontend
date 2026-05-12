"use client";

import { Capacitor } from "@capacitor/core";
import { shareFetchedBlobInNativeApp } from "@/helpers/capacitorBlobDownload.helpers";
import reactUseDownloader from "react-use-downloader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseDownloader = ReturnType<typeof reactUseDownloader>;
type UseDownloaderOptions = Parameters<typeof reactUseDownloader>[0];
type ErrorMessage = UseDownloader["error"];

const getHttpDownloadErrorMessage = (status: number): string | null => {
  switch (status) {
    case 401:
    case 403:
      return "You are not authorized to download this file.";
    case 404:
      return "This download is not available right now.";
    case 429:
      return "Too many download attempts. Please wait a moment and try again.";
    default:
      if (status >= 500) {
        return "The download service is temporarily unavailable.";
      }
      if (status >= 400) {
        return `The download request failed with status ${status}.`;
      }
      return null;
  }
};

const normalizeDownloadError = (error: ErrorMessage): ErrorMessage => {
  if (!error) {
    return error;
  }

  const status = error.errorResponse?.status;
  if (status) {
    const message = getHttpDownloadErrorMessage(status);
    if (message) {
      return { ...error, errorMessage: message };
    }
  }

  const statusMatch = error.errorMessage.match(/^\s*(\d{3})\b/);
  if (statusMatch?.[1]) {
    const message = getHttpDownloadErrorMessage(Number(statusMatch[1]));
    if (message) {
      return { ...error, errorMessage: message };
    }
  }

  return error;
};

const isResponseError = (error: unknown): error is Response =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  "statusText" in error &&
  "headers" in error &&
  "clone" in error;

const getResponseBodyMessage = (body: unknown): unknown => {
  if (typeof body !== "object" || body === null) {
    return body;
  }

  return (
    (body as { error?: unknown; reason?: unknown }).error ??
    (body as { error?: unknown; reason?: unknown }).reason
  );
};

const getDownloadErrorMessage = async (error: unknown): Promise<string> => {
  if (isResponseError(error)) {
    const response = error.clone();
    let body: unknown = null;
    try {
      const contentType = response.headers.get("Content-Type") ?? "";
      body = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
    } catch {
      body = null;
    }

    const bodyMessage = getResponseBodyMessage(body);
    const statusMessage = getHttpDownloadErrorMessage(error.status);
    if (statusMessage) {
      return statusMessage;
    }

    return [
      `${error.status} - ${error.statusText}`,
      typeof bodyMessage === "string" ? bodyMessage : null,
    ]
      .filter(Boolean)
      .join(": ");
  }

  if (error instanceof Error) {
    return error.name === "AbortError" ? "Download timed out" : error.message;
  }

  return "An unknown error occurred.";
};

const mergeDownloadHeaders = (
  optionsHeaders: HeadersInit | undefined,
  overrideHeaders: HeadersInit | undefined
): Headers => {
  const headers = new Headers(optionsHeaders);
  new Headers(overrideHeaders).forEach((value, key) => {
    headers.set(key, value);
  });
  return headers;
};

export default function useDownloader(
  options: UseDownloaderOptions = {}
): UseDownloader {
  const webDownloader = reactUseDownloader(options);
  const isNative = Capacitor.isNativePlatform();
  const [elapsed, setElapsed] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [size, setSize] = useState(0);
  const [error, setError] = useState<ErrorMessage>(null);
  const [isInProgress, setIsInProgress] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const elapsedIntervalRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);

  const clearNativeRequest = useCallback((abort = false) => {
    if (abort) {
      controllerRef.current?.abort();
    }
    if (elapsedIntervalRef.current !== null) {
      globalThis.window.clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    if (timeoutIdRef.current !== null) {
      globalThis.window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    controllerRef.current = null;
    if (isMountedRef.current) {
      setIsInProgress(false);
    }
  }, []);

  const resetNativeState = useCallback(() => {
    setElapsed(0);
    setPercentage(0);
    setSize(0);
    setError(null);
    clearNativeRequest();
  }, [clearNativeRequest]);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      clearNativeRequest(true);
      isMountedRef.current = false;
    };
  }, [clearNativeRequest]);

  const download = useCallback<UseDownloader["download"]>(
    async (downloadUrl, filename, timeout = 0, overrideOptions = {}) => {
      if (!isNative) {
        return webDownloader.download(
          downloadUrl,
          filename,
          timeout,
          overrideOptions
        );
      }

      if (isInProgress) {
        return null;
      }

      resetNativeState();
      setIsInProgress(true);
      const controller = new AbortController();
      controllerRef.current = controller;
      elapsedIntervalRef.current = globalThis.window.setInterval(() => {
        setElapsed((current) => current + 1);
      }, 1000);
      timeoutIdRef.current =
        timeout > 0
          ? globalThis.window.setTimeout(() => controller.abort(), timeout)
          : null;

      try {
        const { headers: optionsHeaders, ...restOptions } = options;
        const { headers: overrideHeaders, ...restOverrideOptions } =
          overrideOptions;
        const response = await fetch(downloadUrl, {
          method: "GET",
          ...restOptions,
          ...restOverrideOptions,
          headers: mergeDownloadHeaders(optionsHeaders, overrideHeaders),
          signal: controller.signal,
        });

        if (!response.ok) {
          setError({ errorMessage: await getDownloadErrorMessage(response) });
          return undefined;
        }

        const blob = await response.blob();
        setSize(blob.size);
        setPercentage(100);
        await shareFetchedBlobInNativeApp(blob, filename);
      } catch (downloadError) {
        const errorMessage = await getDownloadErrorMessage(downloadError);
        if (isMountedRef.current) {
          setError({ errorMessage });
        }
      } finally {
        clearNativeRequest();
      }

      return undefined;
    },
    [
      clearNativeRequest,
      isNative,
      isInProgress,
      options,
      resetNativeState,
      webDownloader,
    ]
  );

  return useMemo(() => {
    if (!isNative) {
      return {
        ...webDownloader,
        error: normalizeDownloadError(webDownloader.error),
      };
    }

    return {
      elapsed,
      percentage,
      size,
      error,
      isInProgress,
      download,
      cancel,
    };
  }, [
    cancel,
    download,
    elapsed,
    error,
    isInProgress,
    isNative,
    percentage,
    size,
    webDownloader,
  ]);
}
