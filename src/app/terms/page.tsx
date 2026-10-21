import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Terms of service" };

export default function Page() {
  return <PlaceholderPage title="Terms of service" summary="The terms that apply when you use Jenny." />;
}
