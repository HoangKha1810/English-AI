import type { Metadata } from "next";
import { DashboardView } from "./DashboardView";

export const metadata: Metadata = {
  title: "Tiến độ của tôi",
  description: "Band score từng kỹ năng, biểu đồ tiến bộ và lịch sử làm bài.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
