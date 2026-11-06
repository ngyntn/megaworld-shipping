import { WorkspaceView } from "@/features/workspace/components/workspace-view";
import { getWorkspace } from "@/features/workspace/services/workspace";

export const metadata = { title: "Không gian của tôi — SeaLogistics" };

export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  const { month } = await searchParams;
  const data = await getWorkspace(Array.isArray(month) ? month[0] : month);
  return <WorkspaceView data={data} />;
}
