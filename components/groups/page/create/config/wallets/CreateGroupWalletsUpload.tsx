"use client";

import { useRef, useCallback } from "react";
import GroupCreateWalletsCount from "./GroupCreateWalletsCount";
import type { GroupCreateWalletsType } from "./GroupCreateWallets";

export default function CreateGroupWalletsUpload({
  type,
  wallets,
  setWallets,
}: {
  readonly type: GroupCreateWalletsType;
  readonly wallets: string[] | null;
  readonly setWallets: (wallets: string[] | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const getAddresses = (lines: string[]): string[] => {
    const delimiterRegex = /[\s,;]+/;
    const addresses = lines.flatMap((line) => {
      return line.split(delimiterRegex).map((part) => {
        const address = part.trim();
        if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
          return address.toLowerCase();
        }
        return null;
      });
    });

    // Filter out nulls
    const filteredAddresses = addresses.filter((address) => address !== null);

    // Create a set to remove duplicates
    const uniqueAddresses = new Set(filteredAddresses);
    return Array.from(uniqueAddresses) as string[];
  };

  const onFileChange = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        const lines = (content as string).split(/\r?\n/);
        setWallets(getAddresses(lines));
      };
      reader.readAsText(file);
    },
    [setWallets]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        onFileChange(file!);
      }
    },
    [onFileChange]
  );

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div>
      <div className="tw-p-3 sm:tw-p-5 tw-bg-iron-950 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
        <p className="tw-mb-0 tw-text-base sm:tw-text-lg tw-font-semibold tw-text-iron-50">
          Add wallets manually
        </p>
        <label
          className="tw-group tw-mt-2 sm:tw-mt-3
        tw-bg-iron-900 tw-border-iron-650 tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full tw-h-32 tw-border-2 tw-border-dashed tw-rounded-lg tw-cursor-pointer hover:tw-border-iron-600 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}>
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-5 lg:tw-p-6">
            <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out">
              <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-50">
                <svg
                  className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 16.2422C2.79401 15.435 2 14.0602 2 12.5C2 10.1564 3.79151 8.23129 6.07974 8.01937C6.54781 5.17213 9.02024 3 12 3C14.9798 3 17.4522 5.17213 17.9203 8.01937C20.2085 8.23129 22 10.1564 22 12.5C22 14.0602 21.206 15.435 20 16.2422M8 16L12 12M12 12L16 16M12 12V21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <p className="tw-mt-4 tw-mb-0 tw-text-sm tw-text-center tw-text-balance tw-text-iron-500">
              Drag and drop your CSV file here, or click to select a file
            </p>
          </div>
          <input
            id={`wallets-upload-${type}`}
            ref={inputRef}
            type="file"
            className="tw-hidden"
            accept="text/csv"
            onChange={(e: any) => {
              if (e.target.files) {
                const file = e.target.files[0];
                onFileChange(file);
              }
            }}
          />
        </label>
        <div className="tw-mt-4 tw-gap-y-2 tw-w-full tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between">
          <GroupCreateWalletsCount
            walletsCount={wallets?.length ?? null}
            loading={false}
            removeWallets={() => setWallets(null)}
          />
        </div>
      </div>
    </div>
  );
}
