import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  phone: z.string().optional(),
});

export const iotPingSchema = z.object({
  bin_id: z.string().uuid(),
  fill_level: z.number().min(0).max(100),
});

export const sendNotificationSchema = z.object({
  toEmail: z.string().email().optional(),
  toPhoneE164: z.string().optional(),
  subject: z.string().optional(),
  bodyText: z.string(),
});

export const binUpsertSchema = z.object({
  label: z.string().min(1),
  locality: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  bin_type: z.enum(["general", "organic", "recyclable"]),
});

export const routeCreateSchema = z.object({
  name: z.string().min(1),
  assigned_driver_id: z.string().uuid(),
  vehicle_number: z.string().min(1),
  shift_date: z.string(),
  bin_ids: z.array(z.string().uuid()).min(1),
});

export const complaintSchema = z.object({
  complaint_type: z.enum(["overflow", "illegal_dumping", "dead_animal", "other"]),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  photo_url: z.string().url().optional().nullable(),
});

export const facilityCheckinSchema = z.object({
  route_id: z.string().uuid(),
  facility_name: z.string().min(1),
  waste_type: z.enum(["general", "organic", "recyclable"]),
  weight_kg: z.coerce.number().min(0),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const exportReportSchema = z.object({
  from: z.string(),
  to: z.string(),
  format: z.enum(["pdf", "csv"]),
});

export const qrGenerateSchema = z.object({
  bag_type: z.enum(["recyclable", "organic"]),
});
