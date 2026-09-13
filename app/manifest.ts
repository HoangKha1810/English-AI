import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE,
    short_name: SITE_NAME,
    description: "Luyện thi IELTS 4 kỹ năng với đề mô phỏng và AI.",
    start_url: SITE_URL,
    display: "standalone",
    background_color: "#06060f",
    theme_color: "#06060f",
    lang: "vi",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
