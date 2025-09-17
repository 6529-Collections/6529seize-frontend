import { redirect } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";

const IndexPage = () => {
  redirect("/");
};

export default IndexPage;

export async function generateMetadata() {
  return getAppMetadata({ title: "Redirecting..." });
}
