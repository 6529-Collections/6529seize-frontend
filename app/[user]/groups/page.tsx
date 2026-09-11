import { notFound, redirect } from "next/navigation";

export default async function GroupsPage({
  params,
}: {
  readonly params?: Promise<{ user: string }>;
}) {
  const resolvedParams = params ? await params : undefined;
  const user = resolvedParams?.user;
  if (!user || user.toLowerCase() === "network") {
    notFound();
  }
  redirect(`/${user}`);
}
