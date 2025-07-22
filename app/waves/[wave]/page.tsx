import { redirect } from "next/navigation";

export default function WaveRedirect({ params }: { params: { wave: string } }) {
  redirect(`/my-stream?wave=${params.wave}`);
}
