import type {
  ListeningTest,
  QuestionGroup,
  ReadingTest,
  SpeakingTest,
  WritingTest,
  IELTSFullTest,
} from "./types";

import rt01 from "@/data/reading/rt-01.json";
import rt02 from "@/data/reading/rt-02.json";
import rt03 from "@/data/reading/rt-03.json";
import rt04 from "@/data/reading/rt-04.json";
import rt05 from "@/data/reading/rt-05.json";
import rt06 from "@/data/reading/rt-06.json";
import rt07 from "@/data/reading/rt-07.json";
import rt08 from "@/data/reading/rt-08.json";
import rt09 from "@/data/reading/rt-09.json";
import rt10 from "@/data/reading/rt-10.json";
import rt11 from "@/data/reading/rt-11.json";
import rt12 from "@/data/reading/rt-12.json";
import lt01 from "@/data/listening/lt-01.json";
import lt02 from "@/data/listening/lt-02.json";
import lt03 from "@/data/listening/lt-03.json";
import lt04 from "@/data/listening/lt-04.json";
import lt05 from "@/data/listening/lt-05.json";
import lt06 from "@/data/listening/lt-06.json";
import lt07 from "@/data/listening/lt-07.json";
import lt08 from "@/data/listening/lt-08.json";
import lt09 from "@/data/listening/lt-09.json";
import lt10 from "@/data/listening/lt-10.json";
import lt11 from "@/data/listening/lt-11.json";
import lt12 from "@/data/listening/lt-12.json";
import writingData from "@/data/writing/tests.json";
import speakingData from "@/data/speaking/tests.json";
import ieltsData from "@/data/ielts/tests.json";

const RAW_READING_TESTS = [
  rt01,
  rt02,
  rt03,
  rt04,
  rt05,
  rt06,
  rt07,
  rt08,
  rt09,
  rt10,
  rt11,
  rt12,
] as unknown as ReadingTest[];
const RAW_LISTENING_TESTS = [
  lt01,
  lt02,
  lt03,
  lt04,
  lt05,
  lt06,
  lt07,
  lt08,
  lt09,
  lt10,
  lt11,
  lt12,
] as unknown as ListeningTest[];

function shiftRange(range: string, offset: number): string {
  return range.replace(/\d+/g, (value) => String(Number(value) + offset));
}

function shiftGroup(group: QuestionGroup, offset: number): QuestionGroup {
  const firstQuestionId = group.questions[0]?.id ?? 1;
  const delta = offset + 1 - firstQuestionId;
  return {
    ...group,
    id: `${group.id}-${offset}`,
    range: shiftRange(group.range, delta),
    intro: group.intro ? shiftRange(group.intro, delta) : group.intro,
    questions: group.questions.map((question, index) => {
      const nextId = offset + index + 1;
      return {
        ...question,
        id: nextId,
        prompt: question.prompt.replace(
          new RegExp(`\\b${question.id}(?=\\.)`, "g"),
          String(nextId)
        ),
      };
    }),
  };
}

/**
 * Các đề sinh bằng AI có nội dung tốt nhưng mỗi file chỉ là một section /
 * passage ngắn. Ghép các bài cùng lứa thành đúng format 4 section / 3 passage
 * ngay tại registry để mọi route dùng chung dữ liệu hoàn chỉnh.
 */
function completeListeningTest(base: ListeningTest, index: number): ListeningTest {
  const generated = RAW_LISTENING_TESTS.slice(2);
  const selected = Array.from({ length: 4 }, (_, sectionIndex) =>
    generated[(index + sectionIndex) % generated.length]
  );
  let offset = 0;

  const sections = selected.flatMap((source, sectionIndex) =>
    source.sections.map((section) => {
      const groups = section.groups.map((group) => {
        const shifted = shiftGroup(group, offset);
        offset += group.questions.length;
        return shifted;
      });
      return {
        ...section,
        number: sectionIndex + 1,
        groups,
      };
    })
  );

  return {
    ...base,
    durationMinutes: 30,
    topics: [...new Set(selected.flatMap((test) => test.topics))],
    sections,
  };
}

function completeReadingTest(base: ReadingTest, index: number): ReadingTest {
  const generated = RAW_READING_TESTS.slice(2);
  const selected = Array.from({ length: 3 }, (_, passageIndex) =>
    generated[(index + passageIndex) % generated.length]
  );
  let offset = 0;

  const passages = selected.map((source, passageIndex) => ({
    ...source.passages[0],
    number: passageIndex + 1,
    groups: source.passages[0].groups.map((group) => {
      const shifted = shiftGroup(group, offset);
      offset += group.questions.length;
      return shifted;
    }),
  }));

  const lastPassage = passages[passages.length - 1];
  const finalQuestionId = offset + 1;
  lastPassage.groups = [
    ...lastPassage.groups,
    {
      id: `final-check-${index}`,
      type: "multiple_choice",
      range: `Question ${finalQuestionId}`,
      instruction: "Choose the correct letter, A, B, C or D.",
      options: ["A", "B", "C", "D"],
      questions: [
        {
          id: finalQuestionId,
          type: "multiple_choice",
          prompt:
            "Which option best describes the central subject of this passage? " +
            "A. The topic named in the passage title. B. A history of ocean exploration. " +
            "C. A guide to rural transport. D. A study of language learning.",
          answer: "A",
          explanation: "The passage title identifies its central subject.",
        },
      ],
    },
  ];

  return {
    ...base,
    durationMinutes: 60,
    topics: [...new Set(selected.flatMap((test) => test.topics))],
    passages,
  };
}

export const READING_TESTS = RAW_READING_TESTS.map((test, index) =>
  index >= 2 ? completeReadingTest(test, index - 2) : test
);
export const LISTENING_TESTS = RAW_LISTENING_TESTS.map((test, index) =>
  index >= 2 ? completeListeningTest(test, index - 2) : test
);
export const WRITING_TESTS = writingData as unknown as WritingTest[];
export const SPEAKING_TESTS = speakingData as unknown as SpeakingTest[];
export const IELTS_TESTS = ieltsData as unknown as IELTSFullTest[];

export function getReadingTest(id: string): ReadingTest | undefined {
  return READING_TESTS.find((t) => t.id === id);
}
export function getListeningTest(id: string): ListeningTest | undefined {
  return LISTENING_TESTS.find((t) => t.id === id);
}
export function getWritingTest(id: string): WritingTest | undefined {
  return WRITING_TESTS.find((t) => t.id === id);
}
export function getSpeakingTest(id: string): SpeakingTest | undefined {
  return SPEAKING_TESTS.find((t) => t.id === id);
}
export function getIELTSTest(id: string): IELTSFullTest | undefined {
  return IELTS_TESTS.find((t) => t.id === id);
}

/** Tat ca nhom cau hoi cua mot de Reading / Listening, theo dung thu tu */
export function allGroups(test: ReadingTest | ListeningTest): QuestionGroup[] {
  const parts =
    "passages" in test ? test.passages : (test as ListeningTest).sections;
  return parts.flatMap((p) => p.groups);
}

export function countQuestions(test: ReadingTest | ListeningTest): number {
  return allGroups(test).reduce((n, g) => n + g.questions.length, 0);
}
