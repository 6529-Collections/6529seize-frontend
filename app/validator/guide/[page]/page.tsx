import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import ValidatorGuidePage from "@/components/validator-page/ValidatorGuidePage";
import { VALIDATOR_GUIDE_PAGES } from "@/lib/validator-page/content/guidePages";
import {
  getLockedView,
  getValidatorMetadata,
} from "@/lib/validator-page/pageAccess";

interface Props {
  readonly params: Promise<{ page: string }>;
}

// The start page is /validator/guide itself, so an empty slug never matches.
const findPage = (slug: string) =>
  VALIDATOR_GUIDE_PAGES.find((page) => page.slug !== "" && page.slug === slug);

export default async function ValidatorGuideSubRoute({ params }: Props) {
  await connection();
  const { page: slug } = await params;
  const page = findPage(slug);
  if (!page) {
    notFound();
  }
  const locked = await getLockedView(`/validator/guide/${page.slug}`);
  if (locked) {
    return locked;
  }
  return <ValidatorGuidePage page={page} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page: slug } = await params;
  const page = findPage(slug);
  return getValidatorMetadata(
    page ? `${page.navTitle} | 6529 Validator guide` : "Guide | 6529 Validator",
    page?.description ?? "The 6529 validator's setup guide."
  );
}
