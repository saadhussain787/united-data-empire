import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch the Complete History from Postgres
    const allTransfers = await prisma.transfer.findMany({ 
      orderBy: { season: 'desc' } 
    });

    // Define the 4 Eras Data Structure
    const erasData = [
      {
        id: 'era1',
        eraName: 'The INEOS Rebuild (2024-Present)',
        summary: { grossSpend: 0, salesRevenue: 0, netSpend: 0, annualAmortization: 0 },
        incoming: [] as any[],
        outgoing: [] as any[]
      },
      {
        id: 'era2',
        eraName: 'The Post-Ferguson Wilderness (2013-2023)',
        summary: { grossSpend: 0, salesRevenue: 0, netSpend: 0, annualAmortization: 0 },
        incoming: [] as any[],
        outgoing: [] as any[]
      },
      {
        id: 'era3',
        eraName: 'The Golden Dynasty (1999-2012)',
        summary: { grossSpend: 0, salesRevenue: 0, netSpend: 0, annualAmortization: 0 },
        incoming: [] as any[],
        outgoing: [] as any[]
      },
      {
        id: 'era4',
        eraName: 'Dawn of the Premier League (1992-1998)',
        summary: { grossSpend: 0, salesRevenue: 0, netSpend: 0, annualAmortization: 0 },
        incoming: [] as any[],
        outgoing: [] as any[]
      }
    ];

    // The Aggregation Engine (Per Era)
    for (const t of allTransfers) {
      if (!t.season) continue;
      
      const startYearStr = t.season.split('/')[0];
      const startYear = parseInt(startYearStr, 10);
      
      if (isNaN(startYear)) continue;

      let targetEra = null;
      if (startYear >= 2024) {
        targetEra = erasData[0]; // Era 1
      } else if (startYear >= 2013 && startYear < 2024) {
        targetEra = erasData[1]; // Era 2
      } else if (startYear >= 1999 && startYear < 2013) {
        targetEra = erasData[2]; // Era 3
      } else {
        targetEra = erasData[3]; // Era 4
      }

      const fee = Number(t.feeNumeric) || 0;
      
      if (t.isIncoming) {
        targetEra.incoming.push(t);
        targetEra.summary.grossSpend += fee;
        targetEra.summary.annualAmortization += (fee / (t.contractYears || 5));
      } else {
        targetEra.outgoing.push(t);
        targetEra.summary.salesRevenue += fee;
      }
    }

    // Post-processing: Calculate net spend and sort arrays
    for (const era of erasData) {
      era.summary.grossSpend = Number(era.summary.grossSpend.toFixed(2));
      era.summary.salesRevenue = Number(era.summary.salesRevenue.toFixed(2));
      era.summary.annualAmortization = Number(era.summary.annualAmortization.toFixed(2));
      era.summary.netSpend = Number((era.summary.grossSpend - era.summary.salesRevenue).toFixed(2));
      era.incoming.sort((a, b) => (b.feeNumeric ?? 0) - (a.feeNumeric ?? 0));
      era.outgoing.sort((a, b) => (b.feeNumeric ?? 0) - (a.feeNumeric ?? 0));
    }

    // Return a clean JSON response
    return NextResponse.json({
      status: 'SUCCESS',
      data: {
        eras: erasData
      }
    });

  } catch (error: any) {
    console.error("FATAL TRANSFERS API ERROR:", error);
    
    return NextResponse.json(
      { 
        status: 'ERROR', 
        message: error.message || 'Failed to read transfer ledger data from database.',
      },
      { status: 500 }
    );
  }
}
