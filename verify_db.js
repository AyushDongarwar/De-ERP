const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  try {
    const count = await prisma.user.count();
    console.log('Prisma check: Success. User count =', count);
  } catch (e) {
    console.error('Prisma check: Failed.', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
check();
