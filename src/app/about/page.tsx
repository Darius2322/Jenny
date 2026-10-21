import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "About Jenny" };

export default function Page() {
  return <PlaceholderPage title="About Jenny" summary="Jenny helps people connect, discover communities and businesses, follow local conversations and message privately." />;
}
