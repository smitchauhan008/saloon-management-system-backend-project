const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const Barber = require('../models/Barber');
const Appointment = require('../models/Appointment');
const Attendance = require('../models/Attendance');
const WageRecord = require('../models/WageRecord');

async function seedDemoData() {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_management';
    await mongoose.connect(connStr);
    console.log('--- Connected to MongoDB for Demo Seeding ---');

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);
    const adminPassword = await bcrypt.hash('adminpassword123', salt);

    // 1. Ensure Admin User
    let admin = await User.findOne({ email: 'admin@salon.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Salon Administrator',
        email: 'admin@salon.com',
        password: adminPassword,
        role: 'Administrator',
        status: 'Active'
      });
      console.log('✓ Admin account created (admin@salon.com)');
    }

    // 2. Create Receptionist
    let receptionist = await User.findOne({ email: 'reception@salon.com' });
    if (!receptionist) {
      receptionist = await User.create({
        name: 'Neha Receptionist',
        email: 'reception@salon.com',
        password: defaultPassword,
        role: 'Receptionist',
        status: 'Active'
      });
      console.log('✓ Receptionist account created (reception@salon.com)');
    }

    // 3. Create Barbers
    let barberUser1 = await User.findOne({ email: 'barber1@salon.com' });
    if (!barberUser1) {
      barberUser1 = await User.create({
        name: 'Vikram Stylist',
        email: 'barber1@salon.com',
        password: defaultPassword,
        role: 'Barber',
        status: 'Active'
      });
    }

    let barber1 = await Barber.findOne({ user_id: barberUser1._id });
    if (!barber1) {
      barber1 = await Barber.create({
        user_id: barberUser1._id,
        specialization: 'Master Barber & Beard Artistry',
        commission_percentage: 40,
        joining_date: new Date('2026-01-15')
      });
      console.log('✓ Barber Vikram profile created (40% commission)');
    }

    let barberUser2 = await User.findOne({ email: 'barber2@salon.com' });
    if (!barberUser2) {
      barberUser2 = await User.create({
        name: 'Elena Colourist',
        email: 'barber2@salon.com',
        password: defaultPassword,
        role: 'Barber',
        status: 'Active'
      });
    }

    let barber2 = await Barber.findOne({ user_id: barberUser2._id });
    if (!barber2) {
      barber2 = await Barber.create({
        user_id: barberUser2._id,
        specialization: 'Hair Coloring & Spa Specialist',
        commission_percentage: 40,
        joining_date: new Date('2026-02-01')
      });
      console.log('✓ Barber Elena profile created (40% commission)');
    }

    // 4. Create Standard Services (per Module 5.3)
    const serviceList = [
      { service_name: 'Haircut', duration: 30, price: 300, description: 'Classic precision haircut and quick styling' },
      { service_name: 'Beard Styling', duration: 25, price: 200, description: 'Beard trim, line-up, and organic oil treatment' },
      { service_name: 'Hair Coloring', duration: 90, price: 1500, description: 'Full global hair color or highlights' },
      { service_name: 'Facial', duration: 45, price: 800, description: 'Deep cleansing and skin rejuvenation facial' },
      { service_name: 'Head Massage', duration: 30, price: 400, description: 'Relaxing Ayurvedic scalp and neck massage' }
    ];

    const dbServices = [];
    for (const s of serviceList) {
      let existing = await Service.findOne({ service_name: s.service_name });
      if (!existing) {
        existing = await Service.create(s);
        console.log(`✓ Service added: ${s.service_name} (₹${s.price})`);
      }
      dbServices.push(existing);
    }

    // 5. Create Sample Customers
    const customerList = [
      { name: 'Aarav Patel', phone: '9876543210', email: 'aarav@gmail.com', gender: 'Male' },
      { name: 'Priya Sharma', phone: '9876543211', email: 'priya@gmail.com', gender: 'Female' },
      { name: 'Rohan Mehta', phone: '9876543212', email: 'rohan@gmail.com', gender: 'Male' },
      { name: 'Ananya Verma', phone: '9876543213', email: 'ananya@gmail.com', gender: 'Female' }
    ];

    const dbCustomers = [];
    for (const c of customerList) {
      let existing = await Customer.findOne({ phone: c.phone });
      if (!existing) {
        existing = await Customer.create(c);
        console.log(`✓ Customer added: ${c.name} (${c.phone})`);
      }
      dbCustomers.push(existing);
    }

    // 6. Create Completed Appointments (Populates Dashboard & Reports)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const existingAppts = await Appointment.find({ barber_id: barber1._id });
    if (existingAppts.length === 0) {
      // Completed appointment 1
      const appt1Date = new Date(today);
      appt1Date.setHours(10, 0, 0, 0);
      await Appointment.create({
        customer_id: dbCustomers[0]._id,
        barber_id: barber1._id,
        service_id: dbServices[0]._id, // Haircut (₹300)
        appointment_date: appt1Date,
        appointment_time: '10:00',
        status: 'Completed',
        remarks: 'Regular client'
      });

      // Completed appointment 2
      const appt2Date = new Date(today);
      appt2Date.setHours(11, 30, 0, 0);
      await Appointment.create({
        customer_id: dbCustomers[1]._id,
        barber_id: barber1._id,
        service_id: dbServices[1]._id, // Beard Styling (₹200)
        appointment_date: appt2Date,
        appointment_time: '11:30',
        status: 'Completed',
        remarks: 'VIP styling'
      });

      // Completed appointment 3 on Barber 2
      const appt3Date = new Date(today);
      appt3Date.setHours(14, 0, 0, 0);
      await Appointment.create({
        customer_id: dbCustomers[0]._id, // Repeat client Aarav!
        barber_id: barber2._id,
        service_id: dbServices[2]._id, // Hair Coloring (₹1500)
        appointment_date: appt3Date,
        appointment_time: '14:00',
        status: 'Completed',
        remarks: 'Premium color job'
      });

      // In Progress appointment
      const appt4Date = new Date(today);
      appt4Date.setHours(16, 0, 0, 0);
      await Appointment.create({
        customer_id: dbCustomers[2]._id,
        barber_id: barber1._id,
        service_id: dbServices[4]._id, // Head Massage (₹400)
        appointment_date: appt4Date,
        appointment_time: '16:00',
        status: 'In Progress',
        remarks: 'Client currently in chair'
      });

      // Confirmed upcoming appointment
      const appt5Date = new Date(today);
      appt5Date.setHours(17, 30, 0, 0);
      await Appointment.create({
        customer_id: dbCustomers[3]._id,
        barber_id: barber2._id,
        service_id: dbServices[3]._id, // Facial (₹800)
        appointment_date: appt5Date,
        appointment_time: '17:30',
        status: 'Confirmed',
        remarks: 'Evening booking'
      });

      console.log('✓ Seeded realistic active & completed appointments for today');
    }

    // 7. Seed Attendance Punch Records
    const existingAttendance = await Attendance.findOne({ barber_id: barber1._id, date: { $gte: new Date(todayStr) } });
    if (!existingAttendance) {
      const punchIn = new Date(today);
      punchIn.setHours(9, 0, 0, 0);
      const punchOut = new Date(today);
      punchOut.setHours(17, 0, 0, 0);

      await Attendance.create({
        barber_id: barber1._id,
        check_in: punchIn,
        check_out: punchOut,
        date: punchIn
      });

      const punchIn2 = new Date(today);
      punchIn2.setHours(9, 30, 0, 0);
      await Attendance.create({
        barber_id: barber2._id,
        check_in: punchIn2,
        check_out: null, // Currently in shift!
        date: punchIn2
      });

      console.log('✓ Seeded daily attendance shift cards');
    }

    console.log('\n======================================================');
    console.log(' ✨ DEMO DATA SEEDED SUCCESSFULLY!');
    console.log('======================================================');
    console.log(' Login Credentials for Evaluation:');
    console.log(' - Administrator: admin@salon.com / adminpassword123');
    console.log(' - Receptionist:  reception@salon.com / password123');
    console.log(' - Barber 1:      barber1@salon.com / password123');
    console.log(' - Barber 2:      barber2@salon.com / password123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo data:', error);
    process.exit(1);
  }
}

seedDemoData();
