const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Job: License Expiry Checker
 * Runs automatically to check for drivers with expired licenses.
 * If expired, updates their status to 'Suspended' and logs the activity.
 */
function startLicenseExpiryJob() {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running License Expiry Job...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find drivers who are not already suspended but have an expired license
      const expiredDrivers = await prisma.driver.findMany({
        where: {
          license_expiry_date: {
            lt: today,
          },
          status: {
            not: 'Suspended',
          },
        },
      });

      if (expiredDrivers.length === 0) {
        console.log('[CRON] No new expired licenses found.');
        return;
      }

      console.log(`[CRON] Found ${expiredDrivers.length} driver(s) with expired licenses. Automating suspension...`);

      // Update statuses and create activity logs in a transaction
      await prisma.$transaction(async (tx) => {
        for (const driver of expiredDrivers) {
          // Suspend driver
          await tx.driver.update({
            where: { id: driver.id },
            data: { status: 'Suspended' },
          });

          // Log activity
          await tx.activity.create({
            data: {
              text: `Automated Workflow: Driver ${driver.name} (${driver.license_number}) suspended due to expired license.`,
            },
          });
        }
      });

      console.log('[CRON] License Expiry Job completed successfully.');
    } catch (error) {
      console.error('[CRON] Error running License Expiry Job:', error);
    }
  });

  console.log('✅ Scheduled Job: License Expiry Checker initialized (Runs at 00:00 daily).');
}

module.exports = { startLicenseExpiryJob };
