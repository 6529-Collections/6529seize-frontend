import { notFound, redirect } from "next/navigation";

export default async function WavesPage({
  params,
}: {
  readonly params?: Promise<{ user: string }> | undefined;
}) {
  const resolvedParams = params ? await params : undefined;
  const user = resolvedParams?.user;
  if (!user) {
    notFound();
  }
  redirect(`/${user}`);
}
