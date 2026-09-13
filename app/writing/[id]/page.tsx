import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { WRITING_TESTS, getWritingTest } from "@/lib/tests";
import { WritingExam } from "./WritingExam";

export function generateStaticParams() {
  return WRITING_TESTS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const test = getWritingTest(id);
  return { title: test ? test.title : "Không tìm thấy đề" };
}

export default async function WritingTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = getWritingTest(id);
  if (!test) notFound();
  return <WritingExam test={test} />;
}
