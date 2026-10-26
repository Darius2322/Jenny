import type { Metadata } from "next";
import { Composer } from "@/components/Composer";

export const metadata: Metadata = { title: "Create post", robots: { index: false } };

export default function CreatePage() {
  return (
    <>
      <h1 className="px-5 pt-6 text-2xl font-extrabold">Create a post</h1>
      <Composer mode="post" />
      <p className="px-4 pt-4 text-sm text-muted">You can attach one photo (JPEG, PNG or WebP, up to 5 MB). Your post is visible according to your profile privacy setting.</p>
    </>
  );
}
