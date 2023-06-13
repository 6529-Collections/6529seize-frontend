import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import { useInterval } from "react-use";
import {
  AllowlistDescription,
  AllowlistRunStatus,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";

export default function AllowlistToolBuilderOperationsActiveRun() {
  const router = useRouter();
  const { allowlist, setAllowlist, refreshState } = useContext(
    AllowlistToolBuilderContext
  );

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
        if (
          allowlist?.activeRun?.status &&
          allowlist.activeRun.status !== AllowlistRunStatus.COMPLETED &&
          data.activeRun?.status === AllowlistRunStatus.COMPLETED
        ) {
          refreshState();
        }
        console.log(allowlist?.activeRun?.status, data.activeRun?.status);
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
    [AllowlistRunStatus.PENDING]: "tw-text-yellow-400 tw-bg-yellow-400/10",
    [AllowlistRunStatus.CLAIMED]: "tw-text-yellow-400 tw-bg-yellow-400/10",
    [AllowlistRunStatus.COMPLETED]: "tw-text-green-400 tw-bg-green-400/10",
    [AllowlistRunStatus.FAILED]: "tw-text-error tw-bg-red-400/10",
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
        <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2 sm:tw-justify-start">
          <div
            className={`tw-flex-none tw-rounded-full tw-p-1 ${
              statusColors[
                allowlist.activeRun.status ?? AllowlistRunStatus.COMPLETED
              ]
            }`}
          >
            <div className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-current"></div>
          </div>
          <div className="tw-hidden tw-text-xs tw-font-medium tw-text-white sm:tw-block">
            {titles[allowlist.activeRun.status ?? AllowlistRunStatus.COMPLETED]}
          </div>
        </div>
      )}
    </div>
  );
}
