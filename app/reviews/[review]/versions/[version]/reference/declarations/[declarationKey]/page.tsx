import {
  getTopLevelDeclarationMetadata,
  getVersionedTopLevelDeclarationStaticParams,
  renderTopLevelDeclarationRoute,
  type StreamSolidityTopLevelDeclarationParams,
} from "@/lib/public-review/streamSolidityTopLevelDeclarationRoute";

type Props = {
  readonly params: Promise<StreamSolidityTopLevelDeclarationParams>;
};

export function generateStaticParams() {
  return getVersionedTopLevelDeclarationStaticParams();
}

export async function generateMetadata({ params }: Props) {
  return getTopLevelDeclarationMetadata(await params);
}

export async function StreamSolidityVersionedTopLevelDeclarationPage({
  params,
}: Props) {
  return renderTopLevelDeclarationRoute(await params);
}

export default StreamSolidityVersionedTopLevelDeclarationPage;
