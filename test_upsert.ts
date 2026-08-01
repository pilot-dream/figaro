import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  try {
    const config = await prisma.gamificationConfig.upsert({
      where: { tenantId: '8c4843c2-10c1-47da-8cbb-304643ec3034' },
      update: { pointsPerCurrency: 2 },
      create: { tenantId: '8c4843c2-10c1-47da-8cbb-304643ec3034', pointsPerCurrency: 2 }
    });
    console.log(config);
  } catch (e) {
    console.error(e);
  }
}
run();
