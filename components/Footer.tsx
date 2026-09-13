import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SKILLS } from "@/lib/skills";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/8">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-violet-500 to-sky-500">
              <Sparkles className="size-4 text-white" strokeWidth={2.4} />
            </span>
            <span className="font-display font-semibold">
              <span className="text-white">IELTS</span>
              <span className="gradient-text">Lab</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            Luyện đủ 4 kỹ năng IELTS với đề thi mô phỏng và nhận xét chi tiết từ AI.
            Toàn bộ đề trên trang là nội dung gốc, không sao chép từ sách luyện thi.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Kỹ năng</h4>
          <ul className="mt-3 space-y-2">
            {SKILLS.map((s) => (
              <li key={s.key}>
                <Link
                  href={s.href}
                  className="text-sm text-slate-400 transition-colors hover:text-violet-300"
                >
                  {s.name} · {s.nameVi}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Tài khoản</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/dashboard" className="text-sm text-slate-400 hover:text-violet-300">
                Tiến độ của tôi
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-sm text-slate-400 hover:text-violet-300">
                Đăng nhập
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/6 px-4 py-5 text-center text-xs text-slate-500">
        IELTS là nhãn hiệu của British Council, IDP và Cambridge. Trang này không liên kết
        với các tổ chức trên.
      </div>
    </footer>
  );
}
