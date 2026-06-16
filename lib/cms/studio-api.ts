import type { CmsPublishedPackage } from "@/lib/cms/types";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

export type CmsApiSite = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description?: string | null | undefined;
  readonly primary_package_hash?: string | null | undefined;
  readonly primary_static_path?: string | null | undefined;
  readonly created_at: string;
  readonly updated_at: string;
};

export type CmsApiPublishedSite = {
  readonly site: CmsApiSite;
  readonly published_package: unknown;
};

type CmsCreateSiteRequest = {
  readonly slug: string;
  readonly title: string;
  readonly description?: string | undefined;
};

type CmsPublishPackageRequest = {
  readonly package_hash: string;
  readonly payload_hash: string;
  readonly schema: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly static_path: string;
  readonly canonical_url: string;
  readonly package_json: CmsPublishedPackage;
  readonly storage: CmsPublishedPackage["storage"];
  readonly signature: CmsPublishedPackage["signature"];
  readonly set_primary: boolean;
};

export function getCmsStudioErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Something went wrong.";
}

export async function getOrCreateCmsSite({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}): Promise<CmsApiSite> {
  const sites = await commonApiFetch<CmsApiSite[]>({
    endpoint: "cms/my/sites",
  });
  const existingHomeSite = sites.find((site) => site.slug === "home");
  if (existingHomeSite) {
    return existingHomeSite;
  }
  return await commonApiPost<CmsCreateSiteRequest, CmsApiSite>({
    endpoint: "cms/sites",
    body: {
      slug: "home",
      title,
      description,
    },
  });
}

export async function publishCmsPackage({
  siteId,
  cmsPackage,
}: {
  readonly siteId: string;
  readonly cmsPackage: CmsPublishedPackage;
}): Promise<CmsApiPublishedSite> {
  return await commonApiPost<CmsPublishPackageRequest, CmsApiPublishedSite>({
    endpoint: `cms/sites/${siteId}/published-packages`,
    body: {
      package_hash: cmsPackage.package_hash,
      payload_hash: cmsPackage.payload_hash,
      schema: cmsPackage.schema,
      title: cmsPackage.payload.page.title,
      description: cmsPackage.payload.page.description,
      static_path: cmsPackage.payload.page.static_export_path,
      canonical_url: cmsPackage.payload.page.canonical_url,
      package_json: cmsPackage,
      storage: cmsPackage.storage,
      signature: cmsPackage.signature,
      set_primary: true,
    },
  });
}
