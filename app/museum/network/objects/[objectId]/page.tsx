import type { Metadata } from "next";
import {
  getMuseumObjectMetadata,
  MuseumObjectPage,
} from "@/components/museum/MuseumObjectPage";

interface MuseumObjectLegacyRouteProps {
  readonly params: Promise<{ objectId: string }>;
}

export async function generateMetadata({
  params,
}: MuseumObjectLegacyRouteProps): Promise<Metadata> {
  const { objectId } = await params;
  return getMuseumObjectMetadata(objectId);
}

export default async function MuseumObjectLegacyRoute({
  params,
}: MuseumObjectLegacyRouteProps) {
  const { objectId } = await params;
  return <MuseumObjectPage objectId={objectId} />;
}
