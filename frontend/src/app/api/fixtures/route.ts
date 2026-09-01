import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json({
      status: 'SUCCESS',
      count: matches.length,
      data: matches,
    });
  } catch (error: unknown) {
    console.error('❌ [API] Error fetching fixtures from database:', error);
    return NextResponse.json(
      {
        status: 'ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve match data from vault',
      },
      { status: 500 }
    );
  }
}