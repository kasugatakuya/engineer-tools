import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolView } from "@/components/tools";
import { TOOL_MAP, TOOLS } from "@/lib/tools";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ tool: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[tool]">): Promise<Metadata> {
  const { tool } = await params;
  const meta = TOOL_MAP[tool];
  if (!meta) return {};
  return { title: meta.name, description: meta.description };
}

export default async function ToolPage({ params }: PageProps<"/tools/[tool]">) {
  const { tool } = await params;
  const meta = TOOL_MAP[tool];
  if (!meta) notFound();
  return <ToolView slug={meta.slug} />;
}
