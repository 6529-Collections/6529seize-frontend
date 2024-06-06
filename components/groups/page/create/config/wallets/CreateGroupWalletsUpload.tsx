import { useRef, useCallback } from "react";

export default function CreateGroupWalletsUpload({
  setWallets,
}: {
  readonly setWallets: (wallets: string[] | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileChange = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        const lines = (content as string).split(/\r?\n/);
        // Regular expression for splitting by common delimiters
        const delimiterRegex = /[\s,;]+/;

        // Find Ethereum addresses or .eth names
        const addresses = lines.flatMap((line) => {
          return line.split(delimiterRegex).map((part) => {
            const address = part.trim();
            if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
              return address;
            }
            // if (address.match(/\.eth$/)) {
            //   return address;
            // }
            return null;
          });
        });

        // Filter out nulls
        const filteredAddresses = addresses.filter(
          (address) => address !== null
        );

        // Create a set to remove duplicates
        const uniqueAddresses = new Set(filteredAddresses);

        setWallets(Array.from(uniqueAddresses));
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
        onFileChange(file);
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
      <div className="tw-inline-flex tw-items-center tw-space-x-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-size-6 tw-text-iron-300"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
          />
        </svg>
        <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          Add wallets manually
        </p>
      </div>
      <label
        className="tw-mt-2 
        tw-bg-iron-900 tw-border-iron-650
      tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full tw-h-40 tw-border-2 tw-border-dashed tw-rounded-lg tw-cursor-pointer hover:tw-border-iron-600 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
      >
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-pt-5 tw-pb-6">
          <p className="tw-mb-2 tw-text-sm tw-text-gray-500">
            Drag and drop your CSV file here, or click to select a file
          </p>
        </div>
        <input
          id="create-group-csv-upload"
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
    </div>
  );
}
