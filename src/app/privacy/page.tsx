import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Page() {
  return <PlaceholderPage title="Privacy policy" summary="How Jenny collects, uses, protects and deletes your information." />;
}
