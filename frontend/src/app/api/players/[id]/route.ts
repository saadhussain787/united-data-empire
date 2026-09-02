import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const player = await prisma.player.findFirst({
      where: {
        OR: [
          { espnId: String(id) },
          { id: isNaN(Number(id)) ? undefined : Number(id) }
        ]
      }
    });

    if (!player) {
      return NextResponse.json(
        { status: 'ERROR', message: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: 'SUCCESS', data: player });
  } catch (error) {
    console.error('Failed to fetch player:', error);
    return NextResponse.json(
      { status: 'ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
