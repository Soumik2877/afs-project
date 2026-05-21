export const ECO_POINTS_PER_BAG: Record<"recyclable" | "organic", number> = {
  recyclable: 15,
  organic: 12,
};

export function pointsForBagType(bagType: "recyclable" | "organic") {
  return ECO_POINTS_PER_BAG[bagType];
}
