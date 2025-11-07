"use client";

import { useState } from "react";
import styles from "@/styles/Home.module.scss";

export default function TestErrorPage() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error("Test error to verify custom error page works");
  }

  const triggerRouteError = () => {
    setShouldError(true);
  };

  const triggerUnhandledError = () => {
    setTimeout(() => {
      throw new Error("Unhandled error test");
    }, 100);
  };

  const triggerAsyncError = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    throw new Error("Async error test");
  };

  const triggerPromiseRejection = () => {
    Promise.reject(new Error("Promise rejection test"));
  };

  return (
    <main className={styles.main}>
      <div className="tw-p-8 tw-space-y-6 tw-max-w-2xl tw-mx-auto">
        <div>
          <h1 className="tw-text-3xl tw-font-bold tw-text-white tw-mb-2">
            Error Testing Page
          </h1>
          <p className="tw-text-gray-400 tw-text-lg">
            Click buttons below to test different error scenarios
          </p>
        </div>
        
        <div className="tw-space-y-3">
          <button
            onClick={triggerRouteError}
            type="button"
            style={{ backgroundColor: '#dc2626', color: 'white' }}
            className="tw-block tw-w-full tw-px-6 tw-py-3 !tw-bg-red-600 !tw-text-white tw-font-semibold tw-rounded-lg hover:!tw-bg-red-700 tw-transition-colors tw-shadow-lg tw-border-0 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-red-500 focus:tw-ring-offset-2 focus:tw-ring-offset-gray-900">
            Trigger Route Error (tests app/error.tsx)
          </button>
          
          <button
            onClick={triggerUnhandledError}
            type="button"
            style={{ backgroundColor: '#ea580c', color: 'white' }}
            className="tw-block tw-w-full tw-px-6 tw-py-3 !tw-bg-orange-600 !tw-text-white tw-font-semibold tw-rounded-lg hover:!tw-bg-orange-700 tw-transition-colors tw-shadow-lg tw-border-0 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-ring-offset-2 focus:tw-ring-offset-gray-900">
            Trigger Unhandled Error (tests ErrorHandler)
          </button>
          
          <button
            onClick={triggerAsyncError}
            type="button"
            style={{ backgroundColor: '#d97706', color: 'white' }}
            className="tw-block tw-w-full tw-px-6 tw-py-3 !tw-bg-amber-600 !tw-text-white tw-font-semibold tw-rounded-lg hover:!tw-bg-amber-700 tw-transition-colors tw-shadow-lg tw-border-0 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-amber-500 focus:tw-ring-offset-2 focus:tw-ring-offset-gray-900">
            Trigger Async Error (tests error boundaries)
          </button>
          
          <button
            onClick={triggerPromiseRejection}
            type="button"
            style={{ backgroundColor: '#9333ea', color: 'white' }}
            className="tw-block tw-w-full tw-px-6 tw-py-3 !tw-bg-purple-600 !tw-text-white tw-font-semibold tw-rounded-lg hover:!tw-bg-purple-700 tw-transition-colors tw-shadow-lg tw-border-0 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500 focus:tw-ring-offset-2 focus:tw-ring-offset-gray-900">
            Trigger Promise Rejection (tests ErrorHandler)
          </button>
        </div>
        
        <div className="tw-mt-8 tw-p-6 tw-bg-gray-800/50 tw-rounded-lg tw-border tw-border-gray-700">
          <p className="tw-text-base tw-font-semibold tw-text-white tw-mb-3">
            Expected behavior:
          </p>
          <ul className="tw-list-disc tw-list-inside tw-text-sm tw-text-gray-300 tw-space-y-2">
            <li>Route errors should show your custom error component</li>
            <li>Unhandled errors should be logged in console with decoded messages</li>
            <li>You should never see the generic Next.js error page</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

