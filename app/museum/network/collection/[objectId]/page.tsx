import type { Metadata } from "next";
import {
  getMuseumObjectMetadata,
  MuseumObjectPage,
} from "@/components/museum/MuseumObjectPage";

interface MuseumObjectRouteProps {
  readonly params: Promise<{ objectId: string }>;
}

export async function generateMetadata({
  params,
}: MuseumObjectRouteProps): Promise<Metadata> {
  const { objectId } = await params;
  return getMuseumObjectMetadata(objectId);
}

export default async function MuseumCollectionObjectRoute({
  params,
}: MuseumObjectRouteProps) {
  const { objectId } = await params;
  return <MuseumObjectPage objectId={objectId} />;
}
