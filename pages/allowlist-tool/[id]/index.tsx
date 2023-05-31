import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { useRouter } from "next/router";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function AllowlistToolAllowlistId() {
  const router = useRouter();
  return (
    <>
      <Header />
      <div className="tw-bg-blue-500">
        <div>{router.query.id}</div>
      </div>
    </>
  );
}
