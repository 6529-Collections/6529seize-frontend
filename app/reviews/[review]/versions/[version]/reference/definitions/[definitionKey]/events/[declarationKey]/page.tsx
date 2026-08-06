import {
  getSolidityDeclarationMetadata,
  renderSolidityDeclarationRoute,
  type StreamSolidityDeclarationParams,
} from "@/lib/public-review/streamSolidityDeclarationRoute";

type Props = {
  readonly params: Promise<StreamSolidityDeclarationParams>;
};

export async function generateMetadata({ params }: Props) {
  return getSolidityDeclarationMetadata({
    kind: "events",
    params: await params,
  });
}

export async function VersionedStreamSolidityEventPage({ params }: Props) {
  return renderSolidityDeclarationRoute({
    kind: "events",
    params: await params,
  });
}

export default VersionedStreamSolidityEventPage;
