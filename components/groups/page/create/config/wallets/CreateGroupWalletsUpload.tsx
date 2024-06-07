import { useRef, useCallback } from "react";
import GroupCreateWalletsCount from "./GroupCreateWalletsCount";

export default function CreateGroupWalletsUpload({
  wallets,
  setWallets,
}: {
  readonly wallets: string[] | null;
  readonly setWallets: (wallets: string[] | null) => void;
}) {
  const haveWallets = !!wallets?.length;
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
              return address.toLowerCase();
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
        const uniqueAddressesArray: string[] = Array.from(
          uniqueAddresses
        ) as string[];
        setWallets(uniqueAddressesArray);
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
      <div className="tw-p-5 tw-bg-iron-900 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
        <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          Add wallets manually
        </p>
        <label
          className="tw-mt-3
        tw-bg-iron-900 tw-border-iron-650
      tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full tw-h-32 tw-border-2 tw-border-dashed tw-rounded-lg tw-cursor-pointer hover:tw-border-iron-600 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
        >
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-pt-5 tw-pb-6">
            <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
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

        <GroupCreateWalletsCount
          walletsCount={wallets?.length ?? null}
          removeWallets={() => setWallets(null)}
        />
      </div>
    </div>
  );
}
