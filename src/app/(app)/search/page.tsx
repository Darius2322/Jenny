import { redirect } from "next/navigation";

export default async function SearchRedirect({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  redirect(q ? `/discover?q=${encodeURIComponent(q)}` : "/discover");
}
