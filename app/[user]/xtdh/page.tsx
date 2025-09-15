import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  readonly params: Promise<{ user: string }>;
}) {
  const { user } = await params;
  redirect(`/${user}/xtdh/overview`);
}
