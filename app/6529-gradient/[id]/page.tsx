import styles from "@/styles/Home.module.scss";
import { GRADIENT_CONTRACT } from "@/constants";
import { fetchUrl } from "@/services/6529api";
import GradientPageComponent from "@/components/6529Gradient/GradientPage";
import { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";

export default async function GradientPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className={styles.main}>
      <GradientPageComponent id={id} />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  let title = `6529 Gradient #${id}`;
  let ogImage = `${process.env.BASE_ENDPOINT}/6529io.png`;
  const response = await fetchUrl(
    `${process.env.API_ENDPOINT}/api/nfts?contract=${GRADIENT_CONTRACT}&id=${id}`
  );
  if (response?.data?.length > 0) {
    if (response.data[0].thumbnail) {
      ogImage = response.data[0].thumbnail;
    } else if (response.data[0].image) {
      ogImage = response.data[0].image;
    }
  }
  return getAppMetadata({
    title,
    description: "Collections | 6529.io",
    ogImage,
    twitterCard: "summary",
  });
}
