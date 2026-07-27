import {
  getActiveTopLevelDeclarationStaticParams,
  getTopLevelDeclarationMetadata,
  renderTopLevelDeclarationRoute,
  type StreamSolidityTopLevelDeclarationParams,
} from "@/lib/public-review/streamSolidityTopLevelDeclarationRoute";

type Props = {
  readonly params: Promise<StreamSolidityTopLevelDeclarationParams>;
};

export function generateStaticParams() {
  return getActiveTopLevelDeclarationStaticParams();
}

export async function generateMetadata({ params }: Props) {
  return getTopLevelDeclarationMetadata(await params);
}

export async function StreamSolidityTopLevelDeclarationPage({ params }: Props) {
  return renderTopLevelDeclarationRoute(await params);
}

export default StreamSolidityTopLevelDeclarationPage;
