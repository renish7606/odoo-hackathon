const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Base exchange rate assumed for realistic seed data: 83.5 INR = 1 USD
// All monetary values in the database are stored as USD (Base Currency)

async function main() {
  console.log('🌱 Seeding database with realistic USD-base data for Indian operations...');

  // Clean existing data in dependency order
  await prisma.activity.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const passwordHash = await bcrypt.hash('devarsh1211', 12);
  const users = await Promise.all([
    prisma.user.create({ data: { email: 'fleet@transitops.com', password_hash: passwordHash, role: 'FleetManager' } }),
    prisma.user.create({ data: { email: 'driver@transitops.com', password_hash: passwordHash, role: 'Driver' } }),
    prisma.user.create({ data: { email: 'safety@transitops.com', password_hash: passwordHash, role: 'SafetyOfficer' } }),
    prisma.user.create({ data: { email: 'finance@transitops.com', password_hash: passwordHash, role: 'FinancialAnalyst' } }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  // 2. Create Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registration_number: 'MH-01-AB-1234', name_model: 'Tata Prima 2825.K', type: 'Truck',
        max_load_capacity: 28000, current_odometer: 45200, acquisition_cost: 41900, status: 'Available', region: 'West',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration_number: 'DL-02-CD-5678', name_model: 'Ashok Leyland Dost+', type: 'Van',
        max_load_capacity: 1500, current_odometer: 32100, acquisition_cost: 9600, status: 'Available', region: 'North',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration_number: 'KA-03-EF-9012', name_model: 'BharatBenz 1617R', type: 'Truck',
        max_load_capacity: 16200, current_odometer: 78500, acquisition_cost: 33500, status: 'OnTrip', region: 'South',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration_number: 'TN-04-GH-3456', name_model: 'Eicher Pro 3019', type: 'Truck',
        max_load_capacity: 19000, current_odometer: 12300, acquisition_cost: 37100, status: 'InShop', region: 'South',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration_number: 'GJ-05-IJ-7890', name_model: 'Mahindra Bolero Pik-up', type: 'Van',
        max_load_capacity: 1300, current_odometer: 55800, acquisition_cost: 11400, status: 'Available', region: 'West',
      },
    }),
  ]);
  console.log(`✅ Created ${vehicles.length} vehicles`);

  // 3. Create Drivers
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: 'Rajesh Kumar', license_number: 'DL-0420110012345', license_category: 'HMV',
        license_expiry_date: new Date('2027-03-15'), contact_number: '+91-9876543210', safety_score: 92, status: 'Available',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Amit Sharma', license_number: 'MH-0220150067890', license_category: 'HMV',
        license_expiry_date: new Date('2026-11-20'), contact_number: '+91-9876543211', safety_score: 88, status: 'OnTrip',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Vikram Singh', license_number: 'KA-0320180034567', license_category: 'LMV',
        license_expiry_date: new Date('2028-06-30'), contact_number: '+91-9876543212', safety_score: 95, status: 'Available',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Suresh Patil', license_number: 'GJ-0120160078901', license_category: 'LMV',
        license_expiry_date: new Date('2027-09-10'), contact_number: '+91-9876543213', safety_score: 78, status: 'OffDuty',
      },
    }),
  ]);
  console.log(`✅ Created ${drivers.length} drivers`);

  // 4. Create Trips
  const pastTrips = await Promise.all([
    prisma.trip.create({
      data: {
        vehicle_id: vehicles[0].id, driver_id: drivers[0].id, source: 'Mumbai', destination: 'Pune',
        planned_distance: 150, cargo_weight: 20000, status: 'Completed', created_at: new Date('2026-06-01T08:00:00Z'),
      }
    }),
    prisma.trip.create({
      data: {
        vehicle_id: vehicles[1].id, driver_id: drivers[2].id, source: 'Delhi', destination: 'Gurugram',
        planned_distance: 35, cargo_weight: 1200, status: 'Completed', created_at: new Date('2026-06-15T09:00:00Z'),
      }
    }),
    prisma.trip.create({
      data: {
        vehicle_id: vehicles[2].id, driver_id: drivers[1].id, source: 'Bengaluru', destination: 'Chennai',
        planned_distance: 350, cargo_weight: 14000, status: 'Completed', created_at: new Date('2026-06-25T06:00:00Z'),
      }
    })
  ]);

  const activeTrips = await Promise.all([
    prisma.trip.create({
      data: {
        vehicle_id: vehicles[2].id, driver_id: drivers[1].id, source: 'Chennai', destination: 'Hyderabad',
        planned_distance: 620, cargo_weight: 15500, status: 'Dispatched', created_at: new Date(),
      }
    }),
  ]);
  console.log(`✅ Created ${pastTrips.length + activeTrips.length} trips`);

  // 5. Create Maintenance Logs
  const maintenance = await Promise.all([
    prisma.maintenanceLog.create({
      data: {
        vehicle_id: vehicles[3].id, issue_description: 'Engine Overheating - Radiator flush required',
        cost: 145.0, status: 'Open', date: new Date(), // ~12000 INR
      }
    }),
    prisma.maintenanceLog.create({
      data: {
        vehicle_id: vehicles[0].id, issue_description: 'Routine Oil Change & Filter replacement',
        cost: 65.0, status: 'Closed', date: new Date('2026-05-15'), // ~5400 INR
      }
    }),
    prisma.maintenanceLog.create({
      data: {
        vehicle_id: vehicles[2].id, issue_description: 'Brake pad replacement (Front & Rear)',
        cost: 210.0, status: 'Closed', date: new Date('2026-04-10'), // ~17500 INR
      }
    }),
  ]);
  console.log(`✅ Created ${maintenance.length} maintenance records`);

  // 6. Create Expenses (Tolls, Service Fees, Fuel)
  const expenses = await Promise.all([
    prisma.expense.create({
      data: { vehicle_id: vehicles[0].id, type: 'Toll', cost: 12.5, date: new Date('2026-06-01T12:00:00Z') } // ~1040 INR
    }),
    prisma.expense.create({
      data: { vehicle_id: vehicles[2].id, type: 'Toll', cost: 18.0, date: new Date('2026-06-25T14:30:00Z') } // ~1500 INR
    }),
    prisma.expense.create({
      data: { vehicle_id: vehicles[1].id, type: 'Service fee', cost: 25.0, date: new Date('2026-06-15T10:00:00Z') } // ~2080 INR
    }),
    // Represent Fuel as Expense records (which the system uses)
    prisma.expense.create({
      data: { vehicle_id: vehicles[0].id, type: 'Fuel Log', cost: 85.0, date: new Date('2026-06-01T07:30:00Z') } // ~7100 INR
    }),
    prisma.expense.create({
      data: { vehicle_id: vehicles[2].id, type: 'Fuel Log', cost: 140.0, date: new Date('2026-06-25T05:45:00Z') } // ~11700 INR
    }),
  ]);
  
  // Create raw FuelLogs (if system uses them directly)
  await prisma.fuelLog.createMany({
    data: [
      { vehicle_id: vehicles[0].id, date: new Date('2026-06-01T07:30:00Z'), liters: 80, cost: 85.0 },
      { vehicle_id: vehicles[2].id, date: new Date('2026-06-25T05:45:00Z'), liters: 130, cost: 140.0 },
    ]
  });
  console.log(`✅ Created ${expenses.length} expense/fuel records`);

  // 7. Create Activity Log
  await prisma.activity.create({
    data: { text: 'System re-initialized with realistic Indian operations data' },
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
