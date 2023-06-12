import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import { useInterval } from "react-use";
import {
  AllowlistDescription,
  AllowlistRunStatus,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";

export default function AllowlistToolBuilderOperationsActiveRun() {
  const router = useRouter();
  const { allowlist, setAllowlist } = useContext(AllowlistToolBuilderContext);

  useInterval(async () => {
    const fetchActiveRun = async () => {
      const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}`;
      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data: AllowlistToolResponse<AllowlistDescription> =
          await response.json();
        if ("error" in data) {
          return;
        }
        setAllowlist(data);
      } catch (error) {
        console.log(error);
      }
    };
    await fetchActiveRun();
  }, 10000);

  useEffect(() => {
    const fetchActiveRun = async () => {
      const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}`;
      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data: AllowlistToolResponse<AllowlistDescription> =
          await response.json();
        if ("error" in data) {
          return;
        }
        setAllowlist(data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchActiveRun();
  }, [router.query.id]);

  const statusColors: Record<AllowlistRunStatus, string> = {
    [AllowlistRunStatus.PENDING]: "tw-fill-yellow-400",
    [AllowlistRunStatus.CLAIMED]: "tw-fill-yellow-400",
    [AllowlistRunStatus.COMPLETED]: "tw-fill-green-400",
    [AllowlistRunStatus.FAILED]: "tw-fill-red-400",
  };

  const titles: Record<AllowlistRunStatus, string> = {
    [AllowlistRunStatus.PENDING]: "Pending",
    [AllowlistRunStatus.CLAIMED]: "Running",
    [AllowlistRunStatus.COMPLETED]: "Completed",
    [AllowlistRunStatus.FAILED]: "Failed",
  };

  return (
    <div>
      {allowlist?.activeRun && (
        <span className="tw-inline-flex tw-items-center tw-gap-x-1.5 tw-rounded-md tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-white tw-ring-1 tw-ring-inset tw-ring-gray-800">
          <svg
            className={`tw-h-1.5 tw-w-1.5 ${
              statusColors[
                allowlist.activeRun.status ?? AllowlistRunStatus.COMPLETED
              ]
            }`}
            viewBox="0 0 6 6"
            aria-hidden="true"
          >
            <circle cx="3" cy="3" r="3" />
          </svg>
          {titles[allowlist.activeRun.status ?? AllowlistRunStatus.COMPLETED]}
        </span>
      )}
    </div>
  );
}
