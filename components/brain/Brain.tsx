import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import BrainLeftSidebar from "./left-sidebar/BrainLeftSidebar";
import BrainContent from "./content/BrainContent";
import BrainRightSidebar from "./right-sidebar/BrainRightSidebar";

export default function Brain({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="tw-relative tw-flex tw-flex-col">
      <div
        className={`tailwind-scope tw-relative tw-flex tw-flex-grow ${
          isCollapsed
            ? "tw-w-full min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto"
            : "tw-px-6"
        }`}
      >
        <div
          className={`tw-h-screen tw-flex-grow tw-flex tw-flex-col lg:tw-flex-row tw-justify-between tw-gap-x-5 tw-gap-y-4 ${
            isCollapsed ? "" : "tw-mr-[20.5rem]"
          }`}
        >
          <BrainLeftSidebar />
          <BrainContent>{children}</BrainContent>
        </div>

        {!!router.query.wave && (
          <BrainRightSidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            waveId={router.query.wave as string}
          />
        )}
      </div>
    </div>
  );
}
