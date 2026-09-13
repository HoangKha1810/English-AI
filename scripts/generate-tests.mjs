#!/usr/bin/env node
/**
 * Sinh them de thi bang Gemini API (free tier).
 *
 * Cach dung:
 *   1. Lay key mien phi tai https://aistudio.google.com/apikey
 *   2. Dat vao .env.local:  GEMINI_API_KEY=...
 *   3. Chay:
 *        node scripts/generate-tests.mjs reading "Tac dong cua rac thai nhua len dai duong"
 *        node scripts/generate-tests.mjs listening "Dat phong khach san"
 *        node scripts/generate-tests.mjs writing "Giao duc truc tuyen"
 *        node scripts/generate-tests.mjs speaking "Am nhac"
 *
 * Free tier co gioi han so luot moi phut. Neu bi loi 429 thi doi mot lat roi chay lai.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ---------------- doc .env.local ---------------- */
function loadEnv() {
  const p = join(ROOT, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
if (!KEY) {
  console.error("Thieu GEMINI_API_KEY. Lay key mien phi tai https://aistudio.google.com/apikey");
  process.exit(1);
}

const [, , kind, ...topicParts] = process.argv;
const topic = topicParts.join(" ");
if (!kind || !["reading", "listening", "writing", "speaking"].includes(kind)) {
  console.error("Cach dung: node scripts/generate-tests.mjs <reading|listening|writing|speaking> \"<chu de>\"");
  process.exit(1);
}
if (!topic) {
  console.error("Thieu chu de. Vi du: node scripts/generate-tests.mjs reading \"Nang luong gio\"");
  process.exit(1);
}

/* ---------------- id tiep theo ---------------- */
const PREFIX = { reading: "rt", listening: "lt", writing: "wt", speaking: "st" }[kind];
const DIR = join(ROOT, "data", kind);

function nextId() {
  if (kind === "writing" || kind === "speaking") {
    const arr = JSON.parse(readFileSync(join(DIR, "tests.json"), "utf8"));
    const nums = arr.map((t) => Number(String(t.id).split("-")[1]) || 0);
    return `${PREFIX}-${String(Math.max(0, ...nums) + 1).padStart(2, "0")}`;
  }
  const nums = readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => Number(f.replace(`${PREFIX}-`, "").replace(".json", "")) || 0);
  return `${PREFIX}-${String(Math.max(0, ...nums) + 1).padStart(2, "0")}`;
}

const id = nextId();

/* ---------------- prompt ---------------- */
const TYPES = readFileSync(join(ROOT, "lib", "types.ts"), "utf8");

const SHARED = `Ban la nguoi bien soan de thi IELTS chuyen nghiep. Hay tao NOI DUNG GOC HOAN TOAN MOI,
tuyet doi khong sao chep tu Cambridge IELTS hay bat ky sach luyen thi nao.

Day la cac interface TypeScript ma du lieu PHAI khop chinh xac:

${TYPES}

Yeu cau chung:
- Tra ve DUY NHAT mot doi tuong JSON hop le, khong kem giai thich, khong kem dau \`\`\`.
- Truong "id" phai la "${id}".
- Truong "difficulty" phai la mot trong: "Dễ", "Trung bình", "Khó".
- TOAN BO NOI DUNG DE THI HIEN CHO THI SINH PHAI VIET BANG TIENG ANH TU NHIEN:
  title, subtitle, topics, passage, transcript, context, instruction, prompt, options,
  answer, cue card, questions, chart title/unit/categories/series/note va usefulLanguage.
- Cac truong "explanation" co the viet bang TIENG VIET, 1-2 cau, de ho tro nguoi hoc.
- Truong "ideas" cua Writing phai viet bang TIENG ANH vi day la goi y hien trong de.
- Khong dich xen ke tieng Viet vao passage, transcript, cau hoi, huong dan hoac dap an.
- So thu tu cau hoi (id) tang dan lien tuc tu 1, khong nhay so.
- Truong "range" cua moi nhom phai khop voi id cac cau trong nhom, vi du "Questions 1-6".`;

const TASKS = {
  reading: `Tao mot ReadingTest ve chu de: "${topic}".
- 1 passage, khoang 800-900 tu, chia 7-8 doan co nhan "A".."H".
- 13 cau hoi, dung it nhat 4 dang khac nhau (true_false_notgiven, matching_information, sentence_completion, multiple_choice, matching_headings).
- Moi dap an dien tu phai la tu XUAT HIEN NGUYEN VAN trong bai doc va ton trong wordLimit.
- "module": "Academic", "durationMinutes": 20.`,

  listening: `Tao mot ListeningTest ve chu de: "${topic}".
- 1 section, 10 cau hoi.
- Transcript 600-700 tu, chia thanh nhieu luot noi ngan.
- "audioSrc" phai la "/audio/${id}-s1.mp3".
- "voices" anh xa moi speaker toi mot giong edge-tts khac nhau, chon tu: en-GB-SoniaNeural, en-GB-RyanNeural, en-AU-NatashaNeural, en-AU-WilliamNeural, en-US-JennyNeural, en-US-GuyNeural, en-CA-ClaraNeural.
- Moi dap an dien tu phai DUOC NOI NGUYEN VAN trong transcript.
- Co it nhat mot cho nguoi noi tu sua loi (distractor), va gia tri noi SAU CUNG moi la dap an.
- "durationMinutes": 8.`,

  writing: `Tao mot WritingTest ve chu de: "${topic}".
- Dung 2 task: taskNumber 1 (Academic, co "chart" day du, 20 phut, 150 tu) va taskNumber 2 (40 phut, 250 tu).
- Trong "chart": moi series co "values" dai bang dung so phan tu cua "categories". Neu kind la "pie" thi chi co 1 series.
- Task 2 co "ideas" (4-6 y bang TIENG ANH) va "usefulLanguage" (5-7 cum tu tieng Anh).
- "module": "Academic".`,

  speaking: `Tao mot SpeakingTest ve chu de: "${topic}".
- Du 3 part. Part 1 co 8-10 cau hoi, prepSeconds 0, speakSeconds 240.
- Part 2 co cueCard voi dung 4 bullet (bullet cuoi bat dau bang "and explain"), questions la [], prepSeconds 60, speakSeconds 120.
- Part 3 co 5-6 cau hoi thao luan truu tuong, prepSeconds 0, speakSeconds 300.`,
};

/* ---------------- goi Gemini ---------------- */
console.log(`Dang sinh de ${kind} "${topic}" voi id ${id}...`);

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SHARED }] },
      contents: [{ role: "user", parts: [{ text: TASKS[kind] }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: "application/json",
        maxOutputTokens: 16384,
      },
    }),
  }
);

if (!res.ok) {
  console.error(`Gemini tra ve loi ${res.status}:`, (await res.text()).slice(0, 400));
  if (res.status === 429) console.error("\nFree tier het luot. Doi vai phut roi chay lai.");
  process.exit(1);
}

const data = await res.json();
const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
if (!text) {
  console.error("Gemini khong tra ve noi dung.");
  process.exit(1);
}

let test;
try {
  const normalized = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    test = JSON.parse(normalized);
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("No JSON object found");
    test = JSON.parse(normalized.slice(start, end + 1));
  }
} catch {
  console.error("Ket qua khong phai JSON hop le. Thu chay lai.");
  console.error("Phan dau ket qua:", text.slice(0, 600));
  process.exit(1);
}
test.id = id;

/* ---------------- kiem tra nhanh ---------------- */
const problems = [];
if (kind === "reading" || kind === "listening") {
  const parts = test.passages ?? test.sections ?? [];
  const ids = parts.flatMap((p) => p.groups.flatMap((g) => g.questions.map((q) => q.id)));
  if (ids.join() !== ids.map((_, i) => i + 1).join()) problems.push("So thu tu cau hoi khong lien tuc");
  if (ids.length === 0) problems.push("Khong co cau hoi nao");
}
if (kind === "writing") {
  const t1 = test.tasks?.find((t) => t.taskNumber === 1);
  const c = t1?.chart;
  if (c) {
    for (const s of c.series ?? []) {
      if (s.values.length !== c.categories.length)
        problems.push(`Series "${s.name}" co so gia tri khac so categories`);
    }
  } else problems.push("Task 1 thieu chart");
}
if (problems.length) {
  console.warn("\nCanh bao:");
  for (const p of problems) console.warn("  - " + p);
  console.warn("Hay mo file va sua lai truoc khi dung.\n");
}

/* ---------------- ghi file ---------------- */
if (kind === "writing" || kind === "speaking") {
  const p = join(DIR, "tests.json");
  const arr = JSON.parse(readFileSync(p, "utf8"));
  arr.push(test);
  writeFileSync(p, JSON.stringify(arr, null, 2) + "\n", "utf8");
  console.log(`Da them ${id} vao data/${kind}/tests.json`);
} else {
  const p = join(DIR, `${id}.json`);
  writeFileSync(p, JSON.stringify(test, null, 2) + "\n", "utf8");
  console.log(`Da ghi data/${kind}/${id}.json`);
  console.log(`\nBuoc cuoi: mo lib/tests.ts va them de moi vao danh sach:`);
  console.log(`  import ${id.replace("-", "")} from "@/data/${kind}/${id}.json";`);
  console.log(`  ... roi them vao mang ${kind.toUpperCase()}_TESTS`);
  if (kind === "listening") console.log(`\nSau do chay: npm run gen:audio`);
}
