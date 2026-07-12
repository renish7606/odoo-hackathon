const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data in dependency order
  await prisma.activity.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // Create default users (one per role)
  const passwordHash = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: { email: 'fleet@transitops.com', password_hash: passwordHash, role: 'FleetManager' },
    }),
    prisma.user.create({
      data: { email: 'driver@transitops.com', password_hash: passwordHash, role: 'Driver' },
    }),
    prisma.user.create({
      data: { email: 'safety@transitops.com', password_hash: passwordHash, role: 'SafetyOfficer' },
    }),
    prisma.user.create({
      data: { email: 'finance@transitops.com', password_hash: passwordHash, role: 'FinancialAnalyst' },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registration_number: 'MH-01-AB-1234',
        name_model: 'Tata Prima',
        type: 'Truck',
        max_load_capacity: 25000,
        current_odometer: 45200,
        acquisition_cost: 3500000,
        status: 'Available',
        region: 'West',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration_number: 'DL-02-CD-5678',
        name_model: 'Ashok Leyland Dost',
        type: 'Van',
        max_load_capacity: 1500,
        current_odometer: 32100,
        acquisition_cost: 800000,
        status: 'Available',
        region: 'North',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration_number: 'KA-03-EF-9012',
        name_model: 'BharatBenz 1617R',
        type: 'Truck',
        max_load_capacity: 16000,
        current_odometer: 78500,
        acquisition_cost: 2800000,
        status: 'Available',
        region: 'South',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration_number: 'TN-04-GH-3456',
        name_model: 'Eicher Pro 3019',
        type: 'Truck',
        max_load_capacity: 19000,
        current_odometer: 12300,
        acquisition_cost: 3100000,
        status: 'Available',
        region: 'South',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration_number: 'GJ-05-IJ-7890',
        name_model: 'Mahindra Bolero Pickup',
        type: 'Van',
        max_load_capacity: 1250,
        current_odometer: 55800,
        acquisition_cost: 950000,
        status: 'Available',
        region: 'West',
      },
    }),
  ]);

  console.log(`✅ Created ${vehicles.length} vehicles`);

  // Create drivers
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: 'Rajesh Kumar',
        license_number: 'DL-0420110012345',
        license_category: 'HMV',
        license_expiry_date: new Date('2027-03-15'),
        contact_number: '+91-9876543210',
        safety_score: 92,
        status: 'Available',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Amit Sharma',
        license_number: 'MH-0220150067890',
        license_category: 'HMV',
        license_expiry_date: new Date('2026-11-20'),
        contact_number: '+91-9876543211',
        safety_score: 88,
        status: 'Available',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Vikram Singh',
        license_number: 'KA-0320180034567',
        license_category: 'LMV',
        license_expiry_date: new Date('2028-06-30'),
        contact_number: '+91-9876543212',
        safety_score: 95,
        status: 'Available',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Suresh Patil',
        license_number: 'GJ-0120160078901',
        license_category: 'HMV',
        license_expiry_date: new Date('2027-09-10'),
        contact_number: '+91-9876543213',
        safety_score: 78,
        status: 'OffDuty',
      },
    }),
  ]);

  console.log(`✅ Created ${drivers.length} drivers`);

  // Create sample expenses
  await prisma.expense.create({
    data: {
      vehicle_id: vehicles[0].id,
      type: 'Toll',
      cost: 1500,
      date: new Date('2026-07-01'),
    },
  });

  console.log('✅ Created sample expense');

  // Create activity log
  await prisma.activity.create({
    data: { text: 'System initialized with seed data' },
  });

  console.log('✅ Created initial activity log');
  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
