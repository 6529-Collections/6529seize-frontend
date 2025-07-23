import Rememes from "@/components/rememes/Rememes";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function ReMemesPage() {
  return <Rememes />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "ReMemes",
    description: "Collections",
    ogImage: `${process.env.BASE_ENDPOINT}/re-memes-b.jpeg`,
  });
}
