import {
  getActiveSolidityDeclarationStaticParams,
  getSolidityDeclarationMetadata,
  renderSolidityDeclarationRoute,
  type StreamSolidityDeclarationParams,
} from "@/lib/public-review/streamSolidityDeclarationRoute";

type Props = {
  readonly params: Promise<StreamSolidityDeclarationParams>;
};

export function generateStaticParams() {
  return getActiveSolidityDeclarationStaticParams("events");
}

export async function generateMetadata({ params }: Props) {
  return getSolidityDeclarationMetadata({
    kind: "events",
    params: await params,
  });
}

export async function StreamSolidityEventPage({ params }: Props) {
  return renderSolidityDeclarationRoute({
    kind: "events",
    params: await params,
  });
}

export default StreamSolidityEventPage;
