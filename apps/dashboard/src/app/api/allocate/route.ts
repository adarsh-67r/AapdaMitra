import { NextRequest, NextResponse } from "next/server";
import { requireAuthority, supabaseServer } from "@/lib/supabase-server";
import { pickNearestAvailable, type Resource, type ResourceType } from "@/lib/allocator";

export async function POST(req: NextRequest) {
  const user = await requireAuthority(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const reportId = body?.report_id as string | undefined;
  const resourceType = body?.resource_type as ResourceType | undefined;

  if (!reportId) {
    return NextResponse.json({ error: "report_id is required" }, { status: 400 });
  }

  const db = supabaseServer();

  const { data: report, error: reportError } = await db
    .from("reports")
    .select("id, lat, lng, status")
    .eq("id", reportId)
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: "report not found" }, { status: 404 });
  }
  if (report.status !== "open") {
    return NextResponse.json(
      { error: `report is already ${report.status}` },
      { status: 409 }
    );
  }

  const { data: resources, error: resourcesError } = await db
    .from("resources")
    .select("id, type, lat, lng, status");

  if (resourcesError) {
    return NextResponse.json({ error: resourcesError.message }, { status: 500 });
  }

  const chosen = pickNearestAvailable(
    { lat: report.lat, lng: report.lng },
    (resources ?? []) as Resource[],
    resourceType
  );

  if (!chosen) {
    return NextResponse.json(
      { assigned: false, reason: "no available resource in range" },
      { status: 200 }
    );
  }

  const { error: updateReportError } = await db
    .from("reports")
    .update({ status: "assigned", assigned_resource_id: chosen.id })
    .eq("id", reportId);

  if (updateReportError) {
    return NextResponse.json({ error: updateReportError.message }, { status: 500 });
  }

  const { error: updateResourceError } = await db
    .from("resources")
    .update({ status: "dispatched" })
    .eq("id", chosen.id);

  if (updateResourceError) {
    return NextResponse.json({ error: updateResourceError.message }, { status: 500 });
  }

  return NextResponse.json({ assigned: true, resource_id: chosen.id });
}
