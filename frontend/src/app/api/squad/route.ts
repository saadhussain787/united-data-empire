import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      where: {
        squadRole: 'SENIOR',
        isActiveSquad: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ status: 'SUCCESS', data: players });
  } catch (error) {
    console.error('Failed to fetch squad:', error);
    return NextResponse.json(
      { status: 'ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}