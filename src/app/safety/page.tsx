import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Safety and reporting" };

export default function Page() {
  return <PlaceholderPage title="Safety and reporting" summary="How to block, report and get help when something is wrong." />;
}
