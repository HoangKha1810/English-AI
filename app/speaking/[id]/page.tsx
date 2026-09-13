import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SPEAKING_TESTS, getSpeakingTest } from "@/lib/tests";
import { SpeakingExam } from "./SpeakingExam";

export function generateStaticParams() {
  return SPEAKING_TESTS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const test = getSpeakingTest(id);
  return { title: test ? test.title : "Không tìm thấy đề" };
}

export default async function SpeakingTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = getSpeakingTest(id);
  if (!test) notFound();
  return <SpeakingExam test={test} />;
}
