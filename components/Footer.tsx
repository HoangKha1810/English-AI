import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SKILLS } from "@/lib/skills";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rose-200/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-2xl bg-linear-to-br from-pink-400 to-fuchsia-500">
              <Sparkles className="size-4 text-white" strokeWidth={2.4} />
            </span>
            <span className="font-display font-semibold">
              <span className="text-ink-900">IELTS</span>
              <span className="gradient-text">Lab</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
            Luyện đủ 4 kỹ năng IELTS với đề thi mô phỏng và nhận xét chi tiết từ AI.
            Toàn bộ đề trên trang là nội dung gốc, không sao chép từ sách luyện thi.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900">Kỹ năng</h4>
          <ul className="mt-3 space-y-2">
            {SKILLS.map((s) => (
              <li key={s.key}>
                <Link
                  href={s.href}
                  className="text-sm text-ink-500 transition-colors hover:text-violet-600"
                >
                  {s.name} · {s.nameVi}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900">Tài khoản</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/dashboard" className="text-sm text-ink-500 hover:text-violet-600">
                Tiến độ của tôi
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-sm text-ink-500 hover:text-violet-600">
                Đăng nhập
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-rose-200/60 px-4 py-5 text-center text-xs text-ink-450">
        IELTS là nhãn hiệu của British Council, IDP và Cambridge. Trang này không liên kết
        với các tổ chức trên.
      </div>
    </footer>
  );
}
