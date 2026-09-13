import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "IELTS Lab · Luyện thi IELTS 4 kỹ năng với AI",
    template: "%s · IELTS Lab",
  },
  description:
    "Luyện Listening, Reading, Writing và Speaking theo đúng format thi thật. Chấm điểm tự động ra band score và nhận xét chi tiết từ AI. Miễn phí.",
  keywords: ["IELTS", "luyện thi IELTS", "IELTS online", "band score", "writing task 2"],
  openGraph: {
    title: "IELTS Lab · Luyện thi IELTS 4 kỹ năng với AI",
    description:
      "Đề mô phỏng đúng format thi thật, chấm điểm tự động và nhận xét chi tiết từ AI.",
    type: "website",
    locale: "vi_VN",
  },
};

export const viewport: Viewport = {
  themeColor: "#06060f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap"
        />
      </head>
      <body className="antialiased">
        <div className="aurora" aria-hidden>
          <div className="aurora-grid" />
        </div>
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
