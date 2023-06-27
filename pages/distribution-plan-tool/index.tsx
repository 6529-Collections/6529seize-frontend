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
      <div className="tw-sticky tw-top-0 tw-z-50">
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
      </div>
      <DistributionPlanToolContextWrapper>
        <DistributionPlanToolPage />
        <DistributionPlanToolSidebar />
      </DistributionPlanToolContextWrapper>
    </>
  );
}
