import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import { useState } from "react";
import DistributionPlanToolContextWrapper from "../../components/distribution-plan-tool/DistributionPlanToolContext";
import DistributionPlanToolPage from "../../components/distribution-plan-tool/DistributionPlanToolPage";
import DistributionPlanToolSidebar from "../../components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanToolSidebar";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function DistributionPlanTool() {
  const [breadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Distribution plan tool" },
  ]);
  return (
    <>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
      <DistributionPlanToolContextWrapper>
        <div className="tw-flex tw-h-full tw-min-h-screen">
        <div className="tw-flex-1 tw-pt-8 tw-pb-12 tw-max-w-[65.625rem] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] tw-min-[1400px]:-max-w-[1250px] tw-mx-auto tw-px-14">
        <DistributionPlanToolPage />
        </div>
         <DistributionPlanToolSidebar />
        </div>
      </DistributionPlanToolContextWrapper>
    </>
  );
}
