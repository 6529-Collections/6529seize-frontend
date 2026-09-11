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
    kind: "errors",
    params: await params,
  });
}

export async function StreamSolidityErrorPage({ params }: Props) {
  return renderSolidityDeclarationRoute({
    kind: "errors",
    params: await params,
  });
}

export default StreamSolidityErrorPage;
