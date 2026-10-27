import { getActiveSpaces } from "@/features/spaces/services/space.service";
import type { ActiveSpaceList } from "@/features/spaces/types/space.types";
import SpacesCatalog from "@/features/spaces/components/SpacesCatalog";

export const dynamic = "force-dynamic";

export default async function SpacesPage() {
  let spaces: ActiveSpaceList;
  let failed = false;
  try { spaces = await getActiveSpaces(); } catch { spaces = []; failed = true; }
  const cards = spaces.map(space => ({ ...space, pricePerHour: Number(space.pricePerHour) }));
  return <SpacesCatalog spaces={cards} failed={failed} />;
}
