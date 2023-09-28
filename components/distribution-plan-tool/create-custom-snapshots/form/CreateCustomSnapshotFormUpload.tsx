import { useState } from "react";
import AllowlistToolAnimationHeightOpacity from "../../../allowlist-tool/common/animation/AllowlistToolAnimationHeightOpacity";
import AllowlistToolAnimationWrapper from "../../../allowlist-tool/common/animation/AllowlistToolAnimationWrapper";
import {
  CustomTokenPoolParamsToken,
  Mutable,
} from "../../../allowlist-tool/allowlist-tool.types";
import { isEthereumAddress } from "../../../../helpers/AllowlistToolHelpers";

export default function CreateCustomSnapshotFormUpload({
  fileName,
  setFileName,
  setTokens,
}: {
  fileName: string | null;
  setFileName: (fileName: string | null) => void;
  setTokens: (tokens: CustomTokenPoolParamsToken[]) => void;
}) {
  const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const csvString = reader.result as string;
      const lines = csvString.split(/\r?\n/);
      const headerRow = lines
        .at(0)
        ?.split(/[;,]/)
        .map((cell) => cell.toLowerCase().trim());
      if (headerRow?.at(0) === "owner") {
        lines.shift();
      }
      const results: CustomTokenPoolParamsToken[] = lines
        .filter((line) => line.trim().length > 0)
        .map((line) => {
          const row = line.split(/[;,]/).map((cell) => cell.trim());
          const result: Mutable<CustomTokenPoolParamsToken, "id"> = {
            owner: row.at(0)?.toLowerCase() || "",
          };
          return result;
        })
        .filter((token) => {
          return isEthereumAddress(token.owner);
        });
      setTokens(results);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };
  return (
    <div>
      <div className="tw-hidden">
        <AllowlistToolAnimationWrapper mode="sync" initial={true}>
          <AllowlistToolAnimationHeightOpacity key="allowlist-tool-builder-custom-token-pool-pool-add-file-title">
            {fileName && (
              <div className="tw-px-3 tw-flex tw-items-center tw-gap-x-3">
                <div className="tw-h-4 tw-w-4 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-neutral-700 tw-ring-4 tw-ring-neutral-800">
                  <svg
                    className="tw-h-2.5 tw-w-2.5 tw-text-primary-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 2.26946V6.4C14 6.96005 14 7.24008 14.109 7.45399C14.2049 7.64215 14.3578 7.79513 14.546 7.89101C14.7599 8 15.0399 8 15.6 8H19.7305M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <span className="tw-text-primary-400 tw-text-xs tw-font-medium">
                  {fileName}
                </span>
              </div>
            )}
          </AllowlistToolAnimationHeightOpacity>
        </AllowlistToolAnimationWrapper>
      </div>

      <label
        htmlFor="fileInput"
        className="tw-group tw-flex tw-items-center tw-justify-center tw-cursor-pointer tw-text-sm tw-font-medium tw-text-primary-300 tw-w-full tw-underline tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-h-5 tw-w-5 tw-mr-2 -tw-ml-1 group-hover:-tw-translate-y-0.5 tw-transform tw-transition tw-duration-300 tw-ease-out"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 15V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V15M17 8L12 3M12 3L7 8M12 3V15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Upload a CSV</span>
      </label>
      <input
        id="fileInput"
        type="file"
        accept="text/csv"
        className="tw-form-input tw-hidden"
        onChange={onFileUpload}
      />
    </div>
  );
}
