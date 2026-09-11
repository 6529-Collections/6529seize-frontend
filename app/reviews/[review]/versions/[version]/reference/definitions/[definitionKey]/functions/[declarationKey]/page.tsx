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
    kind: "functions",
    params: await params,
  });
}

export async function VersionedStreamSolidityFunctionPage({ params }: Props) {
  return renderSolidityDeclarationRoute({
    kind: "functions",
    params: await params,
  });
}

export default VersionedStreamSolidityFunctionPage;
