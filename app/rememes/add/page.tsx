import RememeAddPage from "@/components/rememes/RememeAddPage";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function ReMemesAddPage() {
  return <RememeAddPage />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "ReMemes | Add",
    description: "Collections",
    ogImage: `${process.env.BASE_ENDPOINT}/re-memes-b.jpeg`,
  });
}
