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
      <div className="row justify-content-evenly">
        <div>{router.query.id}</div>
      </div>
    </>
  );
}
