export type IntroToken =
  | { kind: "text"; value: string }
  | { kind: "blank"; questionId: number };

const MARK = "\u0001";

/**
 * Tach doan intro (bang bieu / tom tat / ghi chu) thanh cac doan van ban
 * va cac o trong. Ho tro 2 kieu danh so ma de thi hay dung:
 *   "Surname: ______ (1)"   va   "the town walls of 20______"
 * Neu o trong khong co so, se gan lan luot theo thu tu cau hoi.
 */
export function parseIntro(intro: string, questionIds: number[]): IntroToken[] {
  let work = intro;

  // Thu tu quan trong: xu ly "______ (7)" TRUOC, roi moi toi "20______".
  // Neu lam nguoc lai, "42 ______ (2)" se bi hieu nham so cau la 42.
  work = work.replace(/______\s*\((\d+)\)/g, (_m, n) => MARK + n + MARK);
  work = work.replace(/(\d+)______/g, (_m, n) => MARK + n + MARK);
  work = work.replace(/______/g, MARK + "?" + MARK);

  const parts = work.split(MARK);
  const tokens: IntroToken[] = [];
  let auto = 0;
  const used = new Set<number>();

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i]) tokens.push({ kind: "text", value: parts[i] });
    } else {
      const raw = parts[i];
      let id: number;
      if (raw === "?") {
        while (auto < questionIds.length && used.has(questionIds[auto])) auto++;
        id = questionIds[auto] ?? questionIds[questionIds.length - 1];
        auto++;
      } else {
        id = Number(raw);
      }
      used.add(id);
      tokens.push({ kind: "blank", questionId: id });
    }
  }
  return tokens;
}

export function introHasBlanks(intro?: string): boolean {
  return Boolean(intro && intro.includes("______"));
}

/** Tach prompt dang "The fire burned ______." thanh [truoc, sau] */
export function splitPrompt(prompt: string): [string, string] | null {
  const i = prompt.indexOf("______");
  if (i === -1) return null;
  return [prompt.slice(0, i), prompt.slice(i + 6)];
}
