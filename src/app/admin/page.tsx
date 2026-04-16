export const dynamic = 'force-dynamic';
import { getAdminConfig } from "../actions";
import AdminPanelClient from "@/components/AdminPanelClient";

export default async function AdminPage() {
  const config = await getAdminConfig();
  return <AdminPanelClient config={config} />;
}
