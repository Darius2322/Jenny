export const BUSINESS_CATEGORIES = [
  "Food & drink", "Retail & shopping", "Beauty & wellness", "Health", "Education", "Agriculture",
  "Transport & logistics", "Technology", "Finance", "Real estate", "Events & entertainment",
  "Professional services", "Home & construction", "Other",
] as const;

export type Business = {
  id: string; handle: string; name: string; description: string | null; category: string;
  location_text: string | null; logo_path?: string | null; website: string | null; public_email: string | null; public_phone: string | null;
  verification_status: string; status: string; created_at: string;
};

export type Listing = {
  id: string; business_id: string; title: string; description: string | null; price_text: string | null;
  kind: "product" | "service"; status: "draft" | "published" | "removed";
};

export type Enquiry = { id: string; sender_id: string; listing_id: string | null; message: string; status: "new" | "read" | "closed"; created_at: string };

/** Escape LIKE wildcards so user text is matched literally. */
export function likeEscape(s: string) {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}
