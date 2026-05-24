import { z } from "zod";

export const citizenPickupRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  route_id: z.string().uuid().optional(),
});

export const citizenPickupConfirmSchema = z.object({
  request_id: z.string().uuid(),
});
