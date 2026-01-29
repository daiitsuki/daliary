export const CATEGORY_CONFIG = {
  me: { label: "나", color: "#FDA4AF" },
  partner: { label: "상대방", color: "#7DD3FC" },
  couple: { label: "우리", color: "#C4B5FD" },
} as const;

export type CategoryType = keyof typeof CATEGORY_CONFIG;
