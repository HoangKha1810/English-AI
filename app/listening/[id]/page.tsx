import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LISTENING_TESTS, getListeningTest } from "@/lib/tests";
import { ListeningExam } from "./ListeningExam";

export function generateStaticParams() {
  return LISTENING_TESTS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const test = getListeningTest(id);
  return { title: test ? test.title : "Không tìm thấy đề" };
}

export default async function ListeningTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = getListeningTest(id);
  if (!test) notFound();
  return <ListeningExam test={test} />;
}
