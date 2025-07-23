import { redirect } from "next/navigation";

export default async function WaveRedirect({
  params,
}: {
  readonly params: Promise<{ wave: string }>;
}) {
  const { wave } = await params;
  redirect(`/my-stream?wave=${wave}`);
}
