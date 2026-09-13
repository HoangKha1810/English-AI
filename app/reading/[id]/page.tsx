import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { READING_TESTS, getReadingTest } from "@/lib/tests";
import { ReadingExam } from "./ReadingExam";

export function generateStaticParams() {
  return READING_TESTS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const test = getReadingTest(id);
  return { title: test ? test.title : "Không tìm thấy đề" };
}

export default async function ReadingTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = getReadingTest(id);
  if (!test) notFound();
  return <ReadingExam test={test} />;
}
