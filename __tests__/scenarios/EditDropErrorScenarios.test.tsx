import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDropUpdateMutation } from "@/hooks/drops/useDropUpdateMutation";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiPost } from "@/services/api/common-api";
import type { ApiUpdateDropRequest } from "@/generated/models/ApiUpdateDropRequest";
import {
  createMockDrop,
  createMockRequest,
  createErrorWithStatus,
} from "../utils/editDropTestUtils";

// Mock the API
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

// Mock the MyStreamContext
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(() => ({
    processIncomingDrop: jest.fn(),
  })),
}));

const mockedCommonApiPost = commonApiPost as jest.MockedFunction<
  typeof commonApiPost
>;

describe("Edit Drop Error Scenarios", () => {
  let queryClient: QueryClient;
  let mockSetToast: jest.Mock;
  let mockInvalidateDrops: jest.Mock;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockSetToast = jest.fn();
    mockInvalidateDrops = jest.fn();
    jest.clearAllMocks();
  });

  const createWrapper = () => {
    const authContextValue = {
      setToast: mockSetToast,
    } as any;

    const reactQueryContextValue = {
      invalidateDrops: mockInvalidateDrops,
    } as any;

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authContextValue}>
          <ReactQueryWrapperContext.Provider value={reactQueryContextValue}>
            {children}
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };

  const setupErrorTest = (
    error: any,
    customRequest?: Partial<ApiUpdateDropRequest>
  ) => {
    mockedCommonApiPost.mockRejectedValue(error);
    const { result } = renderHook(() => useDropUpdateMutation(), {
      wrapper: createWrapper(),
    });
    return {
      result,
      triggerMutation: () => {
        const request = customRequest
          ? { ...createMockRequest(), ...customRequest }
          : createMockRequest();
        result.current.mutate({
          dropId: "drop-123",
          request,
          currentDrop: createMockDrop(),
        });
      },
    };
  };

  const expectGenericErrorToast = async () => {
    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith({
        message: "Failed to update drop. Please try again.",
        type: "error",
      });
    });
  };

  const expectTimeLimitErrorToast = async () => {
    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith({
        message:
          "This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.",
        type: "error",
      });
    });
  };

  const testErrorScenario = async (
    error: any,
    expectedToastFn = expectGenericErrorToast,
    customRequest?: Partial<ApiUpdateDropRequest>
  ) => {
    const { triggerMutation } = setupErrorTest(error, customRequest);
    triggerMutation();
    await expectedToastFn();
  };

  const runErrorTests = (
    testCases: Array<{
      error: any;
      desc: string;
      expectToast?: () => Promise<void> | undefined;
      customRequest?: Partial<ApiUpdateDropRequest> | undefined;
    }>
  ) => {
    testCases.forEach(
      ({
        error,
        desc,
        expectToast = expectGenericErrorToast,
        customRequest,
      }) => {
        it(`should handle ${desc}`, async () => {
          await testErrorScenario(error, expectToast, customRequest);
        });
      }
    );
  };

  // Centralized error test configuration to eliminate all duplication
  const errorTestSuites = {
    "Time Limit Violations": {
      tests: [
        "This drop can't be edited after 5 minutes",
        "Drop can't be edited after 5 minutes have passed",
        "Edit time limit exceeded - can't be edited after creation",
      ].map((errorMessage, index) => ({
        error: new Error(errorMessage),
        desc: `time limit error variation ${index + 1}`,
        expectToast: expectTimeLimitErrorToast,
      })),
    },
    "Network Failures": {
      tests: [
        {
          message: "Network timeout",
          name: "TimeoutError",
          desc: "network timeout errors",
        },
        {
          message: "Connection refused",
          name: "NetworkError",
          desc: "connection refused errors",
        },
        {
          message: "Failed to fetch",
          name: undefined,
          desc: "offline scenarios",
        },
        {
          message: "Request was aborted",
          isAbortError: true,
          desc: "fetch abort errors",
        },
      ].map(({ message, name, isAbortError, desc }) => {
        let error: any;
        if (isAbortError) {
          error = new DOMException(message, "AbortError");
        } else {
          error = new Error(message);
          if (name) error.name = name;
        }
        return { error, desc };
      }),
    },
    "API Rate Limiting": {
      tests: [
        {
          message: "Too Many Requests",
          status: 429,
          desc: "429 Too Many Requests error",
        },
        {
          message: "Rate limit exceeded. Try again in 60 seconds.",
          desc: "rate limit with retry-after header info",
        },
      ].map(({ message, status, desc }) => ({
        error: status
          ? createErrorWithStatus(message, status)
          : new Error(message),
        desc,
      })),
    },
    "Permission and Authorization Errors": {
      tests: [
        {
          message: "Unauthorized",
          status: 401,
          desc: "401 Unauthorized error",
        },
        {
          message: "Forbidden - You do not have permission to edit this drop",
          status: 403,
          desc: "403 Forbidden error",
        },
        {
          message: "You can only edit your own drops",
          desc: "ownership validation error",
        },
      ].map(({ message, status, desc }) => ({
        error: status
          ? createErrorWithStatus(message, status)
          : new Error(message),
        desc,
      })),
    },
    "Content Validation Errors": {
      tests: [
        {
          message: "Content exceeds maximum allowed length",
          customRequest: {
            content: "A".repeat(10000),
          } as Partial<ApiUpdateDropRequest>,
          desc: "content too long error",
        },
        { message: "Invalid mention format", desc: "invalid mention error" },
        {
          message: "Content cannot be empty",
          customRequest: { content: "" } as Partial<ApiUpdateDropRequest>,
          desc: "empty content error",
        },
      ].map(({ message, customRequest, desc }) => ({
        error: new Error(message),
        desc,
        customRequest,
      })),
    },
    "Concurrent Edit Conflicts": {
      tests: [
        {
          message: "Drop has been modified by another user",
          status: 409,
          desc: "concurrent modification error",
        },
        {
          message: "Drop version mismatch - please refresh and try again",
          desc: "version mismatch error",
        },
      ].map(({ message, status, desc }) => ({
        error: status
          ? createErrorWithStatus(message, status)
          : new Error(message),
        desc,
      })),
    },
    "Server Errors": {
      tests: [
        { message: "Internal Server Error", status: 500 },
        { message: "Bad Gateway", status: 502 },
        { message: "Service Unavailable", status: 503 },
      ].map(({ message, status }) => ({
        error: createErrorWithStatus(message, status),
        desc: `${status} ${message}`,
      })),
    },
    "Unknown and Edge Case Errors": {
      tests: [
        { value: null, desc: "null error objects" },
        { value: undefined, desc: "undefined error objects" },
        {
          value: { code: "WEIRD_ERROR", details: "Something unexpected" },
          desc: "non-string, non-Error objects",
        },
        { value: 404, desc: "promise rejection with number" },
      ].map(({ value, desc }) => ({
        error: value,
        desc,
      })),
    },
  };

  // Generate all test suites from configuration
  Object.entries(errorTestSuites).forEach(([suiteName, { tests }]) => {
    describe(suiteName, () => {
      runErrorTests(tests);
    });
  });
});
