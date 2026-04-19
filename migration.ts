import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('--- Starting Database Migration ---');
  
  const tables = ['User', 'AdminInput'];
  
  try {
    console.log('Adding debt columns to User table...');
    await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN totalLentAmount REAL DEFAULT 0`);
    console.log('Column totalLentAmount added.');
  } catch (e: any) {
    if (e.message.includes('duplicate column')) {
      console.log('Column totalLentAmount already exists.');
    } else {
      console.error('Error adding totalLentAmount:', e.message);
    }
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN debtInterestPaid REAL DEFAULT 0`);
    console.log('Column debtInterestPaid added.');
  } catch (e: any) {
    if (e.message.includes('duplicate column')) {
      console.log('Column debtInterestPaid already exists.');
    } else {
      console.error('Error adding debtInterestPaid:', e.message);
    }
  }

  try {
    console.log('Adding interest rate column to AdminInput table...');
    await prisma.$executeRawUnsafe(`ALTER TABLE AdminInput ADD COLUMN lendingInterestRate REAL DEFAULT 0`);
    console.log('Column lendingInterestRate added.');
  } catch (e: any) {
    if (e.message.includes('duplicate column')) {
      console.log('Column lendingInterestRate already exists.');
    } else {
      console.error('Error adding lendingInterestRate:', e.message);
    }
  }

  console.log('--- Migration Completed ---');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
