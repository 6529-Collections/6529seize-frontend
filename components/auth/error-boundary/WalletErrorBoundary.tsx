import { Component } from "react";

import { removeAuthJwt } from "@/services/auth/auth.utils";
import { logError, sanitizeErrorMessage } from "@/src/utils/security-logger";

import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Simplified wallet error boundary with minimal UI and console-based debugging
 * Provides essential error recovery without over-engineered complexity
 */
export class WalletErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detailed error information to console for debugging
    console.error("🚨 Wallet Error Boundary Caught Error:", {
      name: error.name,
      message: sanitizeErrorMessage(error.message),
      stack: error.stack ? sanitizeErrorMessage(error.stack) : undefined,
      componentStack: errorInfo.componentStack
        ? sanitizeErrorMessage(errorInfo.componentStack)
        : undefined,
      timestamp: new Date().toISOString(),
      isMinified: !!error.message?.includes("Minified React error"),
    });

    // Log using the secure logging system
    logError("wallet_error_boundary", error);
  }

  private readonly handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private readonly handleReset = async () => {
    try {
      removeAuthJwt();
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear storage:", error);
      window.location.reload();
    }
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="tw-flex tw-min-h-[200px] tw-items-center tw-justify-center tw-p-6">
        <div className="tw-bg-red-50 tw-border-red-200 tw-w-full tw-max-w-md tw-rounded-lg tw-border tw-p-6 tw-text-center">
          <h3 className="tw-text-red-800 tw-mb-3 tw-text-lg tw-font-semibold">
            Connection Problem
          </h3>
          <p className="tw-text-red-700 tw-mb-6">
            Something went wrong with your wallet connection.
          </p>
          <div className="tw-flex tw-flex-col tw-justify-center tw-gap-3 sm:tw-flex-row">
            <button
              onClick={this.handleRetry}
              className="tw-rounded-md tw-bg-blue-600 tw-px-4 tw-py-2 tw-text-white tw-transition-colors hover:tw-bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReset}
              className="tw-bg-red-600 hover:tw-bg-red-700 tw-rounded-md tw-px-4 tw-py-2 tw-text-white tw-transition-colors"
            >
              Clear Storage & Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
