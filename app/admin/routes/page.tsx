import Link from "next/link";

import { RoutesCreateClient } from "@/components/admin/RoutesCreateClient";
import { Button } from "@/components/ui/button";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export default async function AdminRoutesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: routes }, { data: bins }, { data: drivers }] = await Promise.all([
    supabase.from("routes").select("*").order("shift_date", { ascending: false }),
    supabase.from("bins").select("*").order("label"),
    supabase.from("users").select("*").eq("role", "driver"),
  ]);

  return (
    <div className="space-y-10">
      <RoutesCreateClient bins={bins ?? []} drivers={drivers ?? []} adminId={user?.id ?? ""} />
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl">All routes</h2>
          <Button variant="outline" asChild>
            <Link href="/admin/fleet">Fleet map</Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Bins</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </tr>
          </TableHeader>
          <tbody>
            {(routes ?? []).map((route) => (
              <TableRow key={route.id}>
                <TableCell>{route.name}</TableCell>
                <TableCell>{route.shift_date}</TableCell>
                <TableCell>{route.bin_ids?.length ?? 0}</TableCell>
                <TableCell className="capitalize">{route.status}</TableCell>
                <TableCell>
                  <Link className="text-emerald-400" href={`/admin/routes/${route.id}`}>
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
