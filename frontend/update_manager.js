
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.manager.updateMany({
    where: { name: 'Alex Ferguson' },
    data: { name: 'Sir Alex Ferguson' }
  });
  console.log('Updated:', result);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

