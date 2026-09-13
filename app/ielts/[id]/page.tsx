import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  IELTS_TESTS,
  getIELTSTest,
  getListeningTest,
  getReadingTest,
  getSpeakingTest,
  getWritingTest,
} from "@/lib/tests";
import { FullIELTSExam } from "./FullIELTSExam";

export function generateStaticParams() {
  return IELTS_TESTS.map((test) => ({ id: test.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const test = getIELTSTest(id);
  return { title: test ? test.title : "Không tìm thấy đề IELTS" };
}

export default async function IELTSFullTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const full = getIELTSTest(id);
  if (!full) notFound();

  const listening = getListeningTest(full.listeningId);
  const reading = getReadingTest(full.readingId);
  const writing = getWritingTest(full.writingId);
  const speaking = getSpeakingTest(full.speakingId);
  if (!listening || !reading || !writing || !speaking) notFound();

  return (
    <FullIELTSExam
      bundle={{ full, listening, reading, writing, speaking }}
    />
  );
}
