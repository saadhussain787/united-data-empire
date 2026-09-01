// FILE: frontend/src/app/sitemap.ts
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 86400; // Daily cache regeneration

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://the-united-data.com";

  try {
    const [players, matches] = await Promise.all([
      prisma.player.findMany({ select: { id: true } }),
      prisma.match.findMany({ select: { id: true, date: true } }),
    ]);

    const playerUrls: MetadataRoute.Sitemap = players.map((player: { id: number }) => ({
      url: `${baseUrl}/players/${player.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const matchUrls: MetadataRoute.Sitemap = matches.map((match: { id: number; date: Date }) => ({
      url: `${baseUrl}/matches/${match.id}`,
      lastModified: match.date,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "always",
        priority: 1.0,
      },
      ...playerUrls,
      ...matchUrls,
    ];
  } catch (error) {
    console.error("Failed to generate dynamic sitemap entries:", error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "always",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/players/20`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ];
  }
}