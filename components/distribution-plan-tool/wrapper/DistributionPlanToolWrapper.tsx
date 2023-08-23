import dynamic from "next/dynamic";
import Breadcrumb, { Crumb } from "../../breadcrumb/Breadcrumb";
import HeaderPlaceholder from "../../header/HeaderPlaceholder";
import { Poppins } from "next/font/google";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/router";
import { removeDistributionPlanCookie } from "../../../services/distribution-plan-api";
const Header = dynamic(() => import("../../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});
export default function DistributionPlanToolWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { address } = useAccount();
  const router = useRouter();
  const [defaultBreadCrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Distribution plan tool" },
  ]);
  const [breadcrumbs, setBreadCrumbs] = useState<Crumb[]>(defaultBreadCrumbs);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      return;
    }
    router.push("/distribution-plan-tool");
  }, [address]);
  return (
    <>
      <Header />
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <div className={`tw-bg-neutral-900 ${poppins.className}`}>
        <div
          id="allowlist-tool"
          className="tw-overflow-y-auto tw-min-h-screen tw-relative"
        >
          {children}
        </div>
      </div>
    </>
  );
}
