import type { MetadataRoute } from "next";
import {
  IELTS_TESTS,
  LISTENING_TESTS,
  READING_TESTS,
  SPEAKING_TESTS,
  WRITING_TESTS,
} from "@/lib/tests";
import { SITE_URL } from "@/lib/site";

const baseRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/ielts", priority: 0.95, changeFrequency: "weekly" as const },
  { path: "/listening", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/reading", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/writing", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/speaking", priority: 0.85, changeFrequency: "weekly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ...baseRoutes,
    ...IELTS_TESTS.map((test) => ({
      path: `/ielts/${test.id}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...LISTENING_TESTS.map((test) => ({
      path: `/listening/${test.id}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),
    ...READING_TESTS.map((test) => ({
      path: `/reading/${test.id}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),
    ...WRITING_TESTS.map((test) => ({
      path: `/writing/${test.id}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),
    ...SPEAKING_TESTS.map((test) => ({
      path: `/speaking/${test.id}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
