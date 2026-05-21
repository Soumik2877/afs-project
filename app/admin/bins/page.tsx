import { AdminBinsLive } from "@/components/admin/AdminBinsLive";
import { createClient } from "@/lib/supabase/server";

export default async function AdminBinsPage() {
  const supabase = createClient();

  const { data: bins } = await supabase.from("bins").select("*").order("label");

  return <AdminBinsLive seed={bins ?? []} />;
}
