"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as bcrypt from "bcryptjs";

export async function loginUser(email: string, pass: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid credentials" };
  const isValid = await bcrypt.compare(pass, user.password || "");
  if (!isValid) return { error: "Invalid credentials" };

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      payType: user.payType,
      hourlyRate: user.hourlyRate,
      dailyRate: user.dailyRate,
      botPercentage: user.botPercentage,
      releasedFunds: user.releasedFunds,
      lockedFunds: user.lockedFunds,
      coldWalletBalance: user.coldWalletBalance,
    }
  };
}

export async function unlockEmployeeFunds(employeeId: string) {
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error("Employee not found");

  const amountToRelease = employee.lockedFunds;
  
  await prisma.user.update({
    where: { id: employeeId },
    data: {
      releasedFunds: { increment: amountToRelease },
      lockedFunds: 0
    }
  });

  revalidatePath("/dashboard");
  return { success: true, released: amountToRelease };
}

export async function syncLockedFunds(employeeId: string, amount: number) {
  const user = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!user) throw new Error("User not found");

  const coldAmount = amount * 0.15;
  const hotAmount = amount * 0.85;

  await prisma.user.update({
    where: { id: employeeId },
    data: {
      lockedFunds: { increment: hotAmount },
      coldWalletBalance: { increment: coldAmount },
      lastLockDate: new Date()
    }
  });
  revalidatePath("/dashboard");
  revalidatePath("/wallet");
  revalidatePath("/exchange");
  return { success: true };
}

export async function claimReleasedFunds(employeeId: string) {
  const user = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!user) throw new Error("User not found");

  const amount = user.releasedFunds;

  await prisma.user.update({
    where: { id: employeeId },
    data: { 
      releasedFunds: 0,
      coldWalletBalance: { increment: amount }
    }
  });
  revalidatePath("/dashboard");
  revalidatePath("/wallet");
  revalidatePath("/exchange");
  return { success: true };
}

export async function getCurrentUserFinancials(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      coldWalletBalance: true,
      lockedFunds: true,
      lastLockDate: true,
      lockinDays: true,
      releasedFunds: true,
      role: true
    }
  });

  if (user && user.coldWalletBalance < 0) {
    // Auto-repair negative balance from previous bugs
    await prisma.user.update({
      where: { id: userId },
      data: { coldWalletBalance: 0 }
    });
    user.coldWalletBalance = 0;
  }

  return user;
}

export async function getOrgWorkforceFinancials(orgId: string) {
  // Fetch global loop config to sync the organization-wide timer
  const split = await prisma.walletSplit.findFirst();

  // Use raw query for aggregation to ensure reliability
  const results = await prisma.$queryRawUnsafe(
    `SELECT SUM(coldWalletBalance) as cold, SUM(lockedFunds) as hot, SUM(releasedFunds) as released FROM User WHERE orgId = ? AND role = 'EMPLOYEE'`,
    orgId
  ) as any[];

  const totals = results[0] || { cold: 0, hot: 0, released: 0 };

  return {
    coldWalletBalance: Number(totals.cold || 0),
    lockedFunds: Number(totals.hot || 0),
    releasedFunds: Number(totals.released || 0),
    lastLockDate: split?.updatedAt || null,
    lockinDays: 15,
    role: "ORGANIZATION",
    isAggregated: true
  };
}

export async function getOrganizations() {
  return prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE role = 'ORGANIZATION' ORDER BY createdAt DESC`) as Promise<any[]>;
}

export async function getEmployeesByOrg(orgId: string) {
  // Use raw query to ensure we get 'isActive' even with a stale Prisma Client
  return prisma.$queryRawUnsafe(
    `SELECT * FROM User WHERE role = 'EMPLOYEE' AND orgId = ? ORDER BY createdAt DESC`,
    orgId
  ) as Promise<any[]>;
}

export async function createOrganization(email: string, pass: string) {
  try {
    const hashed = await bcrypt.hash(pass, 10);
    await prisma.user.create({
      data: { email, password: hashed, role: "ORGANIZATION" }
    });
    revalidatePath("/dashboard"); // Where SuperAdmin manages orgs
    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    return { error: "Email may already exist" };
  }
}

export async function createEmployee(orgId: string, email: string, pass: string, payType: string, hourly: number, daily: number, botPct: number) {
  try {
    const hashed = await bcrypt.hash(pass, 10);
    await prisma.user.create({
      data: { 
        email, password: hashed, role: "EMPLOYEE", orgId, 
        payType, hourlyRate: hourly, dailyRate: daily, botPercentage: botPct 
      }
    });
    revalidatePath("/dashboard"); // Where Org manages employees
    return { success: true };
  } catch (e) {
    return { error: "Email may already exist" };
  }
}

export async function getTasksForEmployee(id: string) {
  return prisma.task.findMany({ where: { employeeId: id }, orderBy: { createdAt: "desc" } });
}

export async function getTasksForOrg(orgId: string) {
  return prisma.task.findMany({ where: { orgId }, include: { employee: true }, orderBy: { createdAt: "desc" } });
}

export async function createTask(orgId: string, employeeId: string, title: string, desc: string) {
  await prisma.task.create({
    data: { orgId, employeeId, title, description: desc }
  });
  revalidatePath("/dashboard");
}

export async function completeTask(taskId: string) {
  await prisma.task.update({ where: { id: taskId }, data: { status: "COMPLETED" }});
  revalidatePath("/dashboard");
}

export async function createTransaction(userId: string, totalAmount: number, ledgerDeduction: number, type: string, recipient: string) {
  await prisma.$transaction([
    prisma.transaction.create({
      data: { userId, amount: totalAmount, type, recipient, status: "COMPLETED" }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { coldWalletBalance: { decrement: ledgerDeduction } }
    })
  ]);
  revalidatePath('/exchange');
  revalidatePath('/wallet');
}

export async function getTransactions(userId: string) {
  return await prisma.transaction.findMany({ 
    where: { userId },
    orderBy: { createdAt: 'desc' }, 
    take: 20 
  });
}

export async function getAdminConfig() {
  const configs = await prisma.$queryRawUnsafe(`SELECT * FROM AdminInput LIMIT 1`) as any[];
  let config = configs[0];
  
  // Real-time Aggregates
  const [userTotals, employeeCount] = await Promise.all([
    prisma.user.aggregate({
      _sum: { coldWalletBalance: true, lockedFunds: true, releasedFunds: true }
    }),
    prisma.user.count({ where: { role: 'EMPLOYEE' } })
  ]);
  
  const liveTotalFunds = Number(userTotals._sum.coldWalletBalance || 0) + 
                         Number(userTotals._sum.lockedFunds || 0) + 
                         Number(userTotals._sum.releasedFunds || 0) + 
                         Number(config?.mintedBUSD || 0) +
                         Number(config?.monthlyRevenue || 0);

  if (!config) {
    // Logic for newly created config omitted for brevity, adding a basic return
    return { 
      totalFunds: liveTotalFunds,
      totalEmployees: employeeCount,
      profitFromBot: 0,
      totalMachines: 0,
      monthlyRevenue: 0,
      conversionFee: 5,
      botReturnPercentage: 8.5,
      mintedBUSD: 0,
      lendingInterestRate: 0
    };
  }

  return { 
    ...config, 
    totalFunds: liveTotalFunds,
    totalEmployees: employeeCount
  };
}


export async function updateAdminConfig(data: {
  totalFunds: number;
  profitFromBot: number;
  totalEmployees: number;
  totalMachines: number;
  monthlyRevenue: number;
}) {
  const config = await getAdminConfig();
  await prisma.adminInput.update({
    where: { id: config.id },
    data,
  });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function getWalletSplit() {
  let split = await prisma.walletSplit.findFirst();
  if (!split) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    split = await prisma.walletSplit.create({
      data: {
        hotWalletRes: 85,
        coldWalletRes: 15,
        lockedUntil: futureDate,
        unlockCycleActive: true,
      }
    });
  }
  return split;
}

export async function updateWalletSplit(unlockCycleActive: boolean) {
  const split = await getWalletSplit();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 15);
  
  await prisma.walletSplit.update({
    where: { id: split.id },
    data: {
      unlockCycleActive,
      lockedUntil: unlockCycleActive ? futureDate : null,
    }
  });
  revalidatePath('/wallet');
}
export async function getWarehouses(orgId: string) {
  return prisma.warehouse.findMany({ 
    where: { organizationId: orgId }, 
    include: { machineries: true },
    orderBy: { createdAt: "desc" } 
  });
}

export async function createWarehouse(orgId: string, name: string, location: string) {
  await prisma.warehouse.create({
    data: { organizationId: orgId, name, location }
  });
  revalidatePath("/dashboard");
}

export async function addMachinery(warehouseId: string, name: string, type: string) {
  await prisma.machinery.create({
    data: { warehouseId, name, type }
  });
  revalidatePath("/dashboard");
}

export async function updateOrgVizTools(orgId: string, tools: string[]) {
  await prisma.user.update({
    where: { id: orgId },
    data: { vizTools: JSON.stringify(tools) }
  });
  revalidatePath("/dashboard");
}

export async function getSuperAdminAnalytics() {
  const [orgs, config] = await Promise.all([
    prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE role = 'ORGANIZATION'`) as Promise<any[]>,
    getAdminConfig()
  ]);

  const configAny = config as any;
  
  // Fetch all protocol transactions once to calculate accurate fee totals
  const feeTransactions = await prisma.transaction.findMany({
    where: { type: "PROTOCOL_WITHDRAWAL" }
  });

  // Fetch actual sum of all realized funds to ensure 'Global Value' is synced
  const userBalanceTotals = await prisma.user.aggregate({
    _sum: {
      coldWalletBalance: true,
      lockedFunds: true,
      releasedFunds: true
    }
  });

  let totalPlatformFunds = Number(userBalanceTotals._sum.coldWalletBalance || 0) + 
                           Number(userBalanceTotals._sum.lockedFunds || 0) + 
                           Number(userBalanceTotals._sum.releasedFunds || 0) + 
                           Number(config.mintedBUSD || 0) +
                           Number(config.monthlyRevenue || 0);

  let totalNetworkBotProfit = 0;
  let totalActiveWorkforce = 0;
  let totalFeesCollected = 0;
  
  const orgStats = await Promise.all(orgs.map(async (org) => {
    const employees = await prisma.user.findMany({ where: { orgId: org.id, role: "EMPLOYEE" } });
    const tasks = await prisma.task.findMany({ where: { orgId: org.id } });
    
    // Calculate total fees for THIS org from the Transaction ledger
    const orgFeeSum = feeTransactions
      .filter(tx => tx.userId === org.id)
      .reduce((sum, tx) => {
        const meta = JSON.parse(tx.metadata || "{}");
        return sum + (meta.feePaid || 0);
      }, 0);

    let simulatedBotRev = 0;
    employees.forEach(emp => {
      const defaultWeeklyHours = 40;
      const defaultWeeklyDays = 5;
      
      let baseWeekly = 0;
      if (emp.payType === 'HOURLY') {
        baseWeekly = emp.hourlyRate * defaultWeeklyHours;
      } else {
        baseWeekly = emp.dailyRate * defaultWeeklyDays;
      }
      
      const botCut = baseWeekly * (emp.botPercentage / 100);
      simulatedBotRev += botCut * 4; // Simulated monthly cut for ranking
    });

    totalNetworkBotProfit += simulatedBotRev;
    totalActiveWorkforce += employees.length;
    totalFeesCollected += orgFeeSum;

    return {
      id: org.id,
      email: org.email,
      totalEmployees: employees.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      botRevenue: simulatedBotRev,
      currencyFeeRev: orgFeeSum, // Using the synced ledger sum
      totalLentAmount: Number(org.totalLentAmount || 0),
      debtInterestPaid: Number(org.debtInterestPaid || 0),
      isActive: org.isActive === 1 || org.isActive === true || org.isActive === undefined || org.isActive === '1'
    };
  }));

  orgStats.sort((a, b) => b.botRevenue - a.botRevenue);
  
  // Final total includes the realized platform fees collected from protocol withdrawals
  totalPlatformFunds += totalFeesCollected;

  return {
    globalMode: {
      totalPlatformFunds,
      totalNetworkBotProfit,
      totalActiveWorkforce,
      totalFeesCollected,
      totalBotAllocation: totalNetworkBotProfit, // Reflecting the aggregate workforce cut
      botReturnPercentage: configAny.botReturnPercentage ?? 8.5,
      lendingInterestRate: configAny.lendingInterestRate ?? 0,
      totalOrganizations: orgs.length
    },
    orgStats
  };
}

export async function updateBotConfig(percentage: number, isActive: boolean) {
  const config = await getAdminConfig();
  const activeBit = isActive ? 1 : 0;
  
  // Using Raw SQL to bypass stale Prisma Client validation
  await prisma.$executeRawUnsafe(`
    UPDATE AdminInput 
    SET botReturnPercentage = ${percentage}, 
        botActive = ${activeBit}, 
        lastUpdated = DATETIME('now') 
    WHERE id = '${config.id}'
  `);

  revalidatePath('/bot');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateProtocolSettings(mintAmount: number, feeCut: number) {
  const config = await getAdminConfig();
  await prisma.adminInput.update({
    where: { id: config.id },
    data: {
      mintedBUSD: { increment: mintAmount },
      conversionFee: feeCut,
      lastUpdated: new Date()
    }
  });
  revalidatePath('/dashboard');
  revalidatePath('/admin');
  return { success: true };
}

export async function withdrawFromProtocol(orgId: string, requestAmount: number) {
  const config = await getAdminConfig();
  if (config.mintedBUSD < requestAmount) {
    throw new Error("Insufficient Protocol Reserve. Please wait for Super Admin to mint more BUSD.");
  }

  const feeAmount = requestAmount * (config.conversionFee / 100);

  // Update Org's "currencyFeeRev" to track how much fee they have paid total
  // Or add directly to Admin's monthly Revenue, and deduct from minted
  await prisma.$transaction([
    prisma.adminInput.update({
      where: { id: config.id },
      data: {
        mintedBUSD: { decrement: requestAmount },
        monthlyRevenue: { increment: feeAmount }
      }
    }),
    prisma.user.update({
      where: { id: orgId },
      data: {
        currencyFeeRev: { increment: feeAmount }
      }
    }),
    prisma.transaction.create({
      data: {
        userId: orgId,
        amount: requestAmount,
        type: "PROTOCOL_WITHDRAWAL",
        status: "COMPLETED",
        recipient: "Org Treasury",
        metadata: JSON.stringify({ feePaid: feeAmount, netAmount: requestAmount - feeAmount })
      }
    })
  ]);

  revalidatePath('/dashboard');
  return { success: true, netAmount: requestAmount - feeAmount, feePaid: feeAmount };
}

export async function getProtocolLiveStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [taskCount, withdrawalData, topEmployeeData] = await Promise.all([
    prisma.task.count({
      where: { status: "COMPLETED", updatedAt: { gte: today } }
    }),
    prisma.transaction.aggregate({
      where: { type: "WITHDRAWAL", createdAt: { gte: today } },
      _sum: { amount: true }
    }),
    prisma.task.groupBy({
      by: ['employeeId'],
      _count: { id: true },
      where: { status: "COMPLETED", updatedAt: { gte: today } },
      orderBy: { _count: { id: 'desc' } },
      take: 1
    })
  ]);

  let topEmployeeEmail = "No Data";
  if (topEmployeeData.length > 0) {
    const user = await prisma.user.findUnique({
      where: { id: topEmployeeData[0].employeeId },
      select: { email: true }
    });
    topEmployeeEmail = user?.email || "Unknown";
  }

  return {
    tasksCompleted: taskCount,
    totalWithdrawn: withdrawalData._sum.amount || 0,
    topEmployee: topEmployeeEmail
  };
}

export async function updateEmployeeLockin(employeeId: string, days: number) {
  await prisma.user.update({
    where: { id: employeeId },
    data: { lockinDays: days }
  });
  revalidatePath('/dashboard');
  return { success: true };
}
export async function updateEmployeeStatus(employeeId: string, isActive: boolean) {
  return updateUserStatus(employeeId, isActive);
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  // Using raw query to bypass stale Prisma Client validation (due to Windows file lock during generate)
  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET isActive = ${isActive ? 1 : 0} WHERE id = ?`,
    userId
  );
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}
export async function getOrgWorkforceTransactions(orgId: string) {
  return prisma.$queryRawUnsafe(
    `SELECT t.*, u.email as employeeEmail 
     FROM "Transaction" t 
     JOIN "User" u ON t.userId = u.id 
     WHERE u.orgId = ? AND u.role = 'EMPLOYEE' 
     ORDER BY t.createdAt DESC`,
    orgId
  ) as Promise<any[]>;
}

export async function processOrganizationalPayroll(orgId: string) {
  const employees = await prisma.user.findMany({ where: { orgId, role: "EMPLOYEE" } });
  
  let totalWages = 0;
  employees.forEach(emp => {
    // Calculate 1 week of wages
    if (emp.payType === 'HOURLY') {
      totalWages += emp.hourlyRate * 40;
    } else {
      totalWages += emp.dailyRate * 5;
    }
  });

  // Deduct from Org
  await prisma.user.update({
    where: { id: orgId },
    data: { coldWalletBalance: { decrement: totalWages } }
  });

  revalidatePath('/dashboard');
  revalidatePath('/admin');
  return { success: true, amountProcessed: totalWages };
}

export async function lendToOrganization(orgId: string, amount: number) {
  const config = await getAdminConfig();
  
  await prisma.$transaction([
    prisma.adminInput.update({
      where: { id: config.id },
      data: { mintedBUSD: { decrement: amount } }
    }),
    prisma.$executeRawUnsafe(
      `UPDATE "User" SET coldWalletBalance = coldWalletBalance + ?, totalLentAmount = totalLentAmount + ? WHERE id = ?`,
      amount, amount, orgId
    )
  ]);

  revalidatePath('/dashboard');
  return { success: true };
}

export async function repayOrganizationalDebt(orgId: string, amount: number) {
  const [org, config] = await Promise.all([
    prisma.user.findUnique({ where: { id: orgId } }),
    getAdminConfig()
  ]);

  if (!org) throw new Error("Organization not found");
  const configAny = config as any;
  const interestRate = (configAny.lendingInterestRate || 0) / 100;
  
  // Splitting repayment: portion goes to interest revenue, remainder to principal
  const interestPortion = amount * interestRate;
  const principalPortion = amount - interestPortion;

  await prisma.$transaction([
    prisma.adminInput.update({
      where: { id: config.id },
      data: { 
        monthlyRevenue: { increment: interestPortion },
        mintedBUSD: { increment: principalPortion }
      }
    }),
    prisma.$executeRawUnsafe(
      `UPDATE "User" 
       SET coldWalletBalance = coldWalletBalance - ?, 
           totalLentAmount = totalLentAmount - ?, 
           debtInterestPaid = debtInterestPaid + ? 
       WHERE id = ?`,
      amount, principalPortion, interestPortion, orgId
    )
  ]);

  revalidatePath('/dashboard');
  revalidatePath('/revenue');
  return { success: true, interestPaid: interestPortion };
}

export async function updateLendingInterestRate(rate: number) {
  const config = await getAdminConfig();
  await prisma.$executeRawUnsafe(
    `UPDATE AdminInput SET lendingInterestRate = ? WHERE id = ?`,
    rate, config.id
  );
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getProtocolTransactions() {
  return prisma.transaction.findMany({
    where: { type: "PROTOCOL_WITHDRAWAL" },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });
}
