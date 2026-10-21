import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Contact us" };

export default function Page() {
  return <PlaceholderPage title="Contact us" summary="How to reach the Jenny team." />;
}
