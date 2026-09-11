import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function GET() {
  try {
    let managers: any[] = [];
    
    try {
      // First attempt: Query all managers from Prisma
      managers = await prisma.manager.findMany({
        orderBy: { appointedDate: 'desc' },
      });
    } catch (prismaError) {
      console.warn("Prisma failed to retrieve managers. Attempting JSON fallback...", prismaError);
    }
    
    // Defensive Fallback: If Prisma returns an empty list or encounters an error
    if (!managers || managers.length === 0) {
      console.log("No managers found in database. Using JSON cache fallback.");
      
      const possiblePaths = [
        path.join(process.cwd(), 'src', 'data', 'manager_history.json'),
        path.join(process.cwd(), 'frontend', 'src', 'data', 'manager_history.json')
      ];
      
      let fallbackData = null;
      for (const jsonPath of possiblePaths) {
        if (fs.existsSync(jsonPath)) {
          const fileContent = fs.readFileSync(jsonPath, 'utf8');
          fallbackData = JSON.parse(fileContent);
          break;
        }
      }
      
      if (!fallbackData) {
        throw new Error("Critical Error: Database is empty and JSON cache fallback could not be found.");
      }
      
      managers = fallbackData;
      
      // Ensure the JSON backup is sorted by appointedDate descending, just like the Prisma query
      managers.sort((a, b) => new Date(b.appointedDate).getTime() - new Date(a.appointedDate).getTime());
    }

    // High-Res Image & PPG Math Fix
    managers = managers.map(m => {
      let photo = m.photo;
      if (!photo) {
        photo = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=0D0E14&color=D4AF37&size=256`;
      }
      
      let ppg = m.ppg;
      if (!ppg && m.winPercentage > 0) {
        ppg = Number(((m.winPercentage / 100) * 3).toFixed(2));
      }

      return { ...m, photo, ppg };
    });

    // Data Segregation
    let currentManager = managers.find(m => m.isCurrent === true);
    
    // Fallback to the first record in the list if none are explicitly flagged
    if (!currentManager && managers.length > 0) {
      currentManager = managers[0];
    }
    
    const historicalManagers = managers
      .filter(m => m !== currentManager)
      .sort((a, b) => new Date(b.appointedDate).getTime() - new Date(a.appointedDate).getTime());

    // Response Delivery
    return NextResponse.json({
      status: 'SUCCESS',
      data: {
        currentManager,
        historicalManagers,
        totalManagersCount: managers.length
      }
    });
    
  } catch (error: any) {
    console.error("FATAL MANAGER API ERROR:", error);
    return NextResponse.json(
      { status: 'ERROR', message: error.message },
      { status: 500 }
    );
  }
}
