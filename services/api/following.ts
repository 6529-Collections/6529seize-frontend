import { z } from "zod";
import type { ApiOutgoingIdentitySubscriptionsPage } from "@/generated/models/ApiOutgoingIdentitySubscriptionsPage";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { commonApiFetch } from "@/services/api/common-api";

type FollowingIdentity = Pick<
  ApiProfileMin,
  "id" | "handle" | "pfp" | "level" | "primary_address"
>;

// IDENTITY targets are profile overviews. Validate only the fields the shared
// row consumes; the generated target is `any` because other target types differ.
const followingPageSchema = z.object({
  count: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  next: z.boolean(),
  data: z.array(
    z.object({
      target: z.object({
        id: z.string().min(1),
        handle: z
          .string()
          .regex(/^[a-zA-Z0-9._-]+$/)
          .nullable(),
        pfp: z.string().nullable(),
        level: z.number().finite(),
        primary_address: z.string().min(1),
      }),
    })
  ),
});

type FollowingPage = Omit<ApiOutgoingIdentitySubscriptionsPage, "data"> & {
  data: { identity: FollowingIdentity }[];
};

export function parseFollowingPage(response: unknown): FollowingPage {
  const page = followingPageSchema.parse(response);
  return {
    ...page,
    data: page.data.map(({ target }) => ({ identity: target })),
  };
}

export async function fetchFollowingPage(
  page: number,
  signal: AbortSignal,
  pageSize = 100
) {
  const response = await commonApiFetch<ApiOutgoingIdentitySubscriptionsPage>({
    endpoint: "identity-subscriptions/outgoing/IDENTITY",
    params: { page: String(page), page_size: String(pageSize) },
    signal,
  });
  return parseFollowingPage(response);
}
