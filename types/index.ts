export type UserRole = "admin" | "driver" | "citizen";

export type BinStatus = "empty" | "filling" | "full" | "collected";

export type BinType = "general" | "organic" | "recyclable";

export type RouteStatus = "pending" | "active" | "completed";

export type ComplaintType = "overflow" | "illegal_dumping" | "dead_animal" | "other";

export type ComplaintStatus = "open" | "in_progress" | "resolved";

export type BagType = "recyclable" | "organic";

export type FacilityWasteType = "general" | "organic" | "recyclable";

export type BatchStatus = "decomposing" | "ready" | "utilized";

export type CitizenPickupStatus = "pending" | "en_route" | "arrived" | "completed" | "cancelled";

export interface UserRow {
  id: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  eco_points: number;
  locality: string | null;
  created_at: string;
}

export interface BinRow {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  locality: string | null;
  fill_level: number;
  status: BinStatus;
  bin_type: BinType;
  last_updated: string;
  created_at: string;
}

export interface RouteRow {
  id: string;
  name: string;
  assigned_driver_id: string | null;
  vehicle_number: string | null;
  status: RouteStatus;
  bin_ids: string[];
  shift_date: string;
  created_by: string | null;
  created_at: string;
}

export interface PickupRow {
  id: string;
  route_id: string;
  bin_id: string;
  driver_id: string;
  picked_up_at: string;
  driver_latitude: number | null;
  driver_longitude: number | null;
  notes: string | null;
}

export interface FacilityCheckinRow {
  id: string;
  route_id: string;
  driver_id: string;
  facility_name: string;
  waste_type: FacilityWasteType;
  weight_kg: number;
  checked_in_at: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
}

export interface DecompositionBatchRow {
  id: string;
  facility_checkin_id: string;
  batch_label: string;
  deposited_at: string;
  estimated_ready_at: string;
  status: BatchStatus;
  notified: boolean;
}

export interface ComplaintRow {
  id: string;
  reported_by: string;
  complaint_type: ComplaintType;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  status: ComplaintStatus;
  resolved_at: string | null;
  created_at: string;
}

export interface QrCodeRow {
  id: string;
  citizen_id: string;
  code_string: string;
  bag_type: BagType;
  created_at: string;
  scanned_at: string | null;
  scanned_by_driver_id: string | null;
  eco_points_awarded: number;
}

export interface DriverLocationRow {
  id: string;
  driver_id: string;
  route_id: string | null;
  latitude: number;
  longitude: number;
  updated_at: string;
}

export interface BinAlertRow {
  id: string;
  bin_id: string;
  triggered_at: string;
  acknowledged: boolean;
}

export interface AnomalyAlertRow {
  id: string;
  driver_id: string;
  route_id: string | null;
  severity: string;
  reason: string;
  details: Record<string, unknown> | null;
  acknowledged: boolean;
  created_at: string;
}

export interface RouteWithDriver extends RouteRow {
  driver?: Pick<UserRow, "id" | "full_name"> | null;
}

export interface ComplaintWithUser extends ComplaintRow {
  reporter?: Pick<UserRow, "full_name" | "phone"> | null;
}

export interface CitizenPickupRequestRow {
  id: string;
  citizen_id: string;
  route_id: string;
  latitude: number;
  longitude: number;
  status: CitizenPickupStatus;
  created_at: string;
  arrived_at: string | null;
  completed_at: string | null;
}
