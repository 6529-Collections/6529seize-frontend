import { redirect } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

const IndexPage = () => {
  redirect("/om/join-om/");
};

export default IndexPage;

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Redirecting" });
}
