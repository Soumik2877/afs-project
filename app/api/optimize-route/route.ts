import { NextResponse } from "next/server";

import { optimizeBinOrder } from "@/lib/mapbox/routing";
import type { BinRow } from "@/types";

type BinCoord = Pick<BinRow, "id" | "longitude" | "latitude">;

export async function POST(request: Request) {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!token) {
      return NextResponse.json({ error: "NEXT_PUBLIC_MAPBOX_TOKEN not configured" }, { status: 500 });
    }

    const payload = await request.json();
    const bins = payload?.bins as BinCoord[] | undefined;
    const start = payload?.start as { lng: number; lat: number } | undefined;

    if (!bins?.length) {
      return NextResponse.json({ error: "bins array required" }, { status: 400 });
    }

    const optimizedIds = await optimizeBinOrder({ bins, start, accessToken: token });

    return NextResponse.json({ optimizedIds });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ optimizedIds: [] }, { status: 500 });
  }
}
