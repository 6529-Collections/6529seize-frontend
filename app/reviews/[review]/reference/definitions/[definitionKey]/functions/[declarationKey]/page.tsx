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
  return getActiveSolidityDeclarationStaticParams("functions");
}

export async function generateMetadata({ params }: Props) {
  return getSolidityDeclarationMetadata({
    kind: "functions",
    params: await params,
  });
}

export async function StreamSolidityFunctionPage({ params }: Props) {
  return renderSolidityDeclarationRoute({
    kind: "functions",
    params: await params,
  });
}

export default StreamSolidityFunctionPage;
