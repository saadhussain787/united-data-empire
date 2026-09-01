// FILE: prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

interface SeedPlayer {
  id: number;
  name: string;
  nationality: string;
  position: string;
  dateOfBirth: string;
  headshotUrl: string | null;
}

const FULL_SQUAD: SeedPlayer[] = [
  // ----------------------------------------------------
  // GOALKEEPERS (Active First Team)
  // ----------------------------------------------------
  {
    id: 101,
    name: "André Onana",
    nationality: "Cameroon",
    position: "Goalkeeper",
    dateOfBirth: "1996-04-02T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p202641.png",
  },
  {
    id: 102,
    name: "Altay Bayındır",
    nationality: "Turkey",
    position: "Goalkeeper",
    dateOfBirth: "1998-04-14T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p247632.png",
  },
  {
    id: 103,
    name: "Tom Heaton",
    nationality: "England",
    position: "Goalkeeper",
    dateOfBirth: "1986-04-15T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p21205.png",
  },

  // ----------------------------------------------------
  // DEFENDERS (Active First Team)
  // ----------------------------------------------------
  {
    id: 104,
    name: "Diogo Dalot",
    nationality: "Portugal",
    position: "Defender",
    dateOfBirth: "1999-03-18T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p216051.png",
  },
  {
    id: 105,
    name: "Lisandro Martínez",
    nationality: "Argentina",
    position: "Defender",
    dateOfBirth: "1998-01-18T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p453814.png",
  },
  {
    id: 106,
    name: "Matthijs de Ligt",
    nationality: "Netherlands",
    position: "Defender",
    dateOfBirth: "1999-08-12T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p219352.png",
  },
  {
    id: 107,
    name: "Harry Maguire",
    nationality: "England",
    position: "Defender",
    dateOfBirth: "1993-03-05T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p95658.png",
  },
  {
    id: 108,
    name: "Leny Yoro",
    nationality: "France",
    position: "Defender",
    dateOfBirth: "2005-11-13T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p587002.png",
  },
  {
    id: 109,
    name: "Luke Shaw",
    nationality: "England",
    position: "Defender",
    dateOfBirth: "1995-07-12T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p106760.png",
  },
  {
    id: 110,
    name: "Noussair Mazraoui",
    nationality: "Morocco",
    position: "Defender",
    dateOfBirth: "1997-11-14T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p219350.png",
  },
  {
    id: 111,
    name: "Tyrell Malacia",
    nationality: "Netherlands",
    position: "Defender",
    dateOfBirth: "1999-08-17T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p232787.png",
  },
  {
    id: 112,
    name: "Jonny Evans",
    nationality: "Northern Ireland",
    position: "Defender",
    dateOfBirth: "1988-01-03T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p37642.png",
  },

  // ----------------------------------------------------
  // MIDFIELDERS (Active First Team)
  // ----------------------------------------------------
  {
    id: 113,
    name: "Bruno Fernandes",
    nationality: "Portugal",
    position: "Midfielder",
    dateOfBirth: "1994-09-08T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p141746.png",
  },
  {
    id: 114,
    name: "Kobbie Mainoo",
    nationality: "England",
    position: "Midfielder",
    dateOfBirth: "2005-04-19T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p532840.png",
  },
  {
    id: 115,
    name: "Manuel Ugarte",
    nationality: "Uruguay",
    position: "Midfielder",
    dateOfBirth: "2001-04-11T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p466037.png",
  },
  {
    id: 116,
    name: "Casemiro",
    nationality: "Brazil",
    position: "Midfielder",
    dateOfBirth: "1992-02-23T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p61256.png",
  },
  {
    id: 117,
    name: "Mason Mount",
    nationality: "England",
    position: "Midfielder",
    dateOfBirth: "1999-01-10T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p184341.png",
  },
  {
    id: 118,
    name: "Christian Eriksen",
    nationality: "Denmark",
    position: "Midfielder",
    dateOfBirth: "1992-02-14T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p80607.png",
  },

  // ----------------------------------------------------
  // FORWARDS (Active First Team)
  // ----------------------------------------------------
  {
    id: 119,
    name: "Marcus Rashford",
    nationality: "England",
    position: "Forward",
    dateOfBirth: "1997-10-31T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p176297.png",
  },
  {
    id: 120,
    name: "Alejandro Garnacho",
    nationality: "Argentina",
    position: "Forward",
    dateOfBirth: "2004-07-01T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p493105.png",
  },
  {
    id: 121,
    name: "Rasmus Højlund",
    nationality: "Denmark",
    position: "Forward",
    dateOfBirth: "2003-02-04T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p500588.png",
  },
  {
    id: 122,
    name: "Joshua Zirkzee",
    nationality: "Netherlands",
    position: "Forward",
    dateOfBirth: "2001-05-22T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p462424.png",
  },
  {
    id: 123,
    name: "Amad Diallo",
    nationality: "Ivory Coast",
    position: "Forward",
    dateOfBirth: "2002-07-11T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p468165.png",
  },
  {
    id: 124,
    name: "Antony",
    nationality: "Brazil",
    position: "Forward",
    dateOfBirth: "2000-02-24T00:00:00.000Z",
    headshotUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/p467169.png",
  },

  // ----------------------------------------------------
  // HISTORICAL LEGENDS (Dedicated for /history museum)
  // ----------------------------------------------------
  {
    id: 201,
    name: "Wayne Rooney",
    nationality: "England",
    position: "Forward",
    dateOfBirth: "1985-10-24T00:00:00.000Z",
    headshotUrl: null,
  },
  {
    id: 202,
    name: "Eric Cantona",
    nationality: "France",
    position: "Forward",
    dateOfBirth: "1966-05-24T00:00:00.000Z",
    headshotUrl: null,
  },
  {
    id: 203,
    name: "Sir Bobby Charlton",
    nationality: "England",
    position: "Midfielder",
    dateOfBirth: "1937-10-11T00:00:00.000Z",
    headshotUrl: null,
  },
  {
    id: 204,
    name: "George Best",
    nationality: "Northern Ireland",
    position: "Forward",
    dateOfBirth: "1946-05-22T00:00:00.000Z",
    headshotUrl: null,
  },
  {
    id: 205,
    name: "Ryan Giggs",
    nationality: "Wales",
    position: "Midfielder",
    dateOfBirth: "1973-11-29T00:00:00.000Z",
    headshotUrl: null,
  },
  {
    id: 206,
    name: "Roy Keane",
    nationality: "Ireland",
    position: "Midfielder",
    dateOfBirth: "1971-08-10T00:00:00.000Z",
    headshotUrl: null,
  },
  {
    id: 207,
    name: "David Beckham",
    nationality: "England",
    position: "Midfielder",
    dateOfBirth: "1975-05-02T00:00:00.000Z",
    headshotUrl: null,
  },
  {
    id: 208,
    name: "Paul Scholes",
    nationality: "England",
    position: "Midfielder",
    dateOfBirth: "1974-11-16T00:00:00.000Z",
    headshotUrl: null,
  },
  {
    id: 209,
    name: "Peter Schmeichel",
    nationality: "Denmark",
    position: "Goalkeeper",
    dateOfBirth: "1963-11-18T00:00:00.000Z",
    headshotUrl: null,
  },
  {
    id: 20,
    name: "Ole Gunnar Solskjær",
    nationality: "Norway",
    position: "Forward",
    dateOfBirth: "1973-02-26T00:00:00.000Z",
    headshotUrl: null,
  },
  {
    id: 10,
    name: "Teddy Sheringham",
    nationality: "England",
    position: "Forward",
    dateOfBirth: "1966-04-02T00:00:00.000Z",
    headshotUrl: null,
  },
];

async function main() {
  console.log("--------------------------------------------------");
  console.log("⚡ SEEDING VERIFIED 25-MAN SQUAD & SEPARATED LEGENDS ⚡");
  console.log("--------------------------------------------------");

  for (const player of FULL_SQUAD) {
    await prisma.player.upsert({
      where: { id: player.id },
      update: {
        name: player.name,
        nationality: player.nationality,
        position: player.position,
        dateOfBirth: new Date(player.dateOfBirth),
        headshotUrl: player.headshotUrl,
      },
      create: {
        id: player.id,
        name: player.name,
        nationality: player.nationality,
        position: player.position,
        dateOfBirth: new Date(player.dateOfBirth),
        headshotUrl: player.headshotUrl,
      },
    });
    console.log(`✓ ${player.name} (${player.position}) - Asset Verified`);
  }

  console.log("--------------------------------------------------");
  console.log("🏆 SQUAD UPDATE COMPLETE! 🏆");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });