import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Help and support" };

export default function Page() {
  return <PlaceholderPage title="Help and support" summary="Answers to common questions about using Jenny." />;
}
