import { notFound } from "next/navigation";
import { getActiveSpaceById } from "@/features/spaces/services/space.service";
import SpaceDetail from "@/features/spaces/components/SpaceDetail";

export const dynamic = "force-dynamic";
export default async function SpaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const space = await getActiveSpaceById(id);
  if (!space) notFound();
  return <SpaceDetail space={{ ...space, pricePerHour: Number(space.pricePerHour) }} />;
}
