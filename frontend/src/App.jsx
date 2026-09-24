import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Users, 
  Calendar, 
  Sparkles, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  UserPlus,
  UserCheck,
  CreditCard,
  DollarSign,
  BarChart3,
  TrendingUp,
  ExternalLink,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { api } from './api';
import './App.css';

const DOCS_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/docs` 
  : (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3000/api/docs' : '/api/docs');


function App() {
  // Global States
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored && stored !== 'undefined' ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [alert, setAlert] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle mobile drawer body scroll lock & escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (tabKey, action) => {
    setCurrentTab(tabKey);
    setMobileMenuOpen(false);
    if (action) action();
  };

  // Form States for Login & Register
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState('Receptionist');

  // Business Data States
  const [customers, setCustomers] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);

  // Loading States
  const [loading, setLoading] = useState(false);

  // Modal States
  const [showModal, setShowModal] = useState(null); // 'customer' | 'barber' | 'service' | 'appointment'
  const [editItem, setEditItem] = useState(null); // Item currently being edited

  // Temp Form States for CRUD
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', gender: 'Male' });
  const [barberForm, setBarberForm] = useState({ user_id: '', specialization: '', commission_percentage: 40, joining_date: '' });
  const [serviceForm, setServiceForm] = useState({ name: '', price: '', duration: '' });
  const [appointmentForm, setAppointmentForm] = useState({ 
    customer_id: '', 
    service_id: '', 
    barber_id: '', 
    date: '', 
    time: '',
    status: 'Pending',
    remarks: ''
  });
  const [appointmentDateFilter, setAppointmentDateFilter] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('');

  // Week 8: Slot Conflict Engine & Exceptions States
  const [slotExceptions, setSlotExceptions] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotInfo, setSlotInfo] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Holiday',
    start_time: '',
    end_time: '',
    reason: '',
    barber_id: ''
  });
  const [gridFilter, setGridFilter] = useState({
    date: new Date().toISOString().split('T')[0],
    barber_id: '',
    service_id: ''
  });
  const [gridData, setGridData] = useState(null);
  const [loadingGrid, setLoadingGrid] = useState(false);

  // Week 9: Attendance Tracking States
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [manualAttendanceBarber, setManualAttendanceBarber] = useState('');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
  const [attendanceBarberFilter, setAttendanceBarberFilter] = useState('');

  // Week 10: Automatic Commission & Payroll Subsystems States
  const [wageRecords, setWageRecords] = useState([]);
  const [wageSummary, setWageSummary] = useState(null);
  const [wageCalcData, setWageCalcData] = useState(null);
  const [loadingWageCalc, setLoadingWageCalc] = useState(false);
  const [selectedWageMonth, setSelectedWageMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedWageBarber, setSelectedWageBarber] = useState('');
  const [baseSalaryInput, setBaseSalaryInput] = useState(15000);
  const [finalizingWage, setFinalizingWage] = useState(false);

  // Week 11: Enterprise Dashboard Analytical Pipelines States
  const [dailyReportData, setDailyReportData] = useState(null);
  const [monthlyReportData, setMonthlyReportData] = useState(null);
  const [topServicesData, setTopServicesData] = useState(null);
  const [barberPerformanceData, setBarberPerformanceData] = useState(null);
  const [customerVisitsData, setCustomerVisitsData] = useState(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [loadingReports, setLoadingReports] = useState(false);



  // Trigger alert
  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Fetch all data when authenticated
  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);


  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const servicesData = await api.getServices();
      setServices(servicesData);

      const barbersData = await api.getBarbers();
      setBarbers(barbersData);

      if (user?.role === 'Administrator' || user?.role === 'Receptionist') {
        const customersData = await api.getCustomers();
        setCustomers(customersData);

        const appointmentsData = await api.getAppointments({
          date: appointmentDateFilter || undefined,
          status: appointmentStatusFilter || undefined
        });
        setAppointments(appointmentsData);

        const exceptionsData = await api.getSlotExceptions();
        setSlotExceptions(exceptionsData);

        if (user?.role === 'Administrator') {
          const staffData = await api.getStaff();
          setStaff(staffData);
        }
      }

      // Fetch Attendance & Wages for Administrator and Barber (Section 4 RBAC)
      if (user?.role === 'Administrator' || user?.role === 'Barber') {
        fetchAttendance();
        fetchWagesData();
      }

      if (user?.role === 'Administrator') {
        fetchReportsData();
      }
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (customFilters = null) => {
    try {
      const filters = customFilters !== null ? customFilters : {
        date: attendanceDateFilter || undefined,
        barber_id: attendanceBarberFilter || undefined
      };
      const cleanFilters = {};
      if (filters.date) cleanFilters.date = filters.date;
      if (filters.barber_id) cleanFilters.barber_id = filters.barber_id;

      const records = await api.getAttendance(cleanFilters);
      setAttendanceRecords(records);

      const summary = await api.getAttendanceSummary(cleanFilters);
      setAttendanceSummary(summary);

      // Check today's punch status
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = records.find(r => {
        const recordDateStr = r.date ? new Date(r.date).toISOString().split('T')[0] : '';
        if (user?.role === 'Barber') {
          return recordDateStr === todayStr;
        }
        if (manualAttendanceBarber) {
          const bId = typeof r.barber_id === 'object' ? r.barber_id?._id : r.barber_id;
          return recordDateStr === todayStr && bId === manualAttendanceBarber;
        }
        return recordDateStr === todayStr;
      });
      setTodayAttendance(todayRecord || null);
    } catch (err) {
      if (user?.role !== 'Receptionist') {
        triggerAlert('danger', err.message);
      }
    }
  };

  const handleCheckIn = async (targetBarberId = null) => {
    setPunchLoading(true);
    try {
      const payload = targetBarberId ? { barber_id: targetBarberId } : {};
      await api.checkIn(payload);
      triggerAlert('success', 'Checked in successfully! Daily timecard opened.');
      fetchAttendance();
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setPunchLoading(false);
    }
  };

  const handleCheckOut = async (targetBarberId = null) => {
    setPunchLoading(true);
    try {
      const payload = targetBarberId ? { barber_id: targetBarberId } : {};
      const res = await api.checkOut(payload);
      triggerAlert('success', `Checked out successfully! Shift completed (${res.shift_duration_hours} hrs).`);
      fetchAttendance();
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setPunchLoading(false);
    }
  };

  const fetchWagesData = async (month = selectedWageMonth) => {
    try {
      if (user?.role === 'Administrator') {
        const records = await api.getWages({ month });
        setWageRecords(records);
        const summary = await api.getPayrollSummary({ month });
        setWageSummary(summary);
      } else if (user?.role === 'Barber') {
        const records = await api.getMyWages();
        setWageRecords(records);
      }
    } catch (err) {
      if (user?.role !== 'Receptionist') {
        triggerAlert('danger', err.message);
      }
    }
  };

  const handleCalculatePayroll = async (barberId = selectedWageBarber, month = selectedWageMonth) => {
    setLoadingWageCalc(true);
    try {
      const data = await api.calculatePayroll({
        barber_id: barberId || undefined,
        month
      });
      setWageCalcData(data);
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setLoadingWageCalc(false);
    }
  };

  const handleFinalizePayout = async (barberId, salaryAmount, commissionAmount = undefined) => {
    setFinalizingWage(true);
    try {
      const payload = {
        barber_id: barberId,
        month: selectedWageMonth,
        salary: Number(salaryAmount || 0)
      };
      if (commissionAmount !== undefined && commissionAmount !== null) {
        payload.commission = Number(commissionAmount);
      }
      await api.finalizePayroll(payload);
      triggerAlert('success', `Monthly wage statement finalized and logged to balance ledger!`);
      fetchWagesData(selectedWageMonth);
      handleCalculatePayroll(selectedWageBarber, selectedWageMonth);
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setFinalizingWage(false);
    }
  };

  const fetchReportsData = async (date = reportDate, year = reportYear) => {
    if (user?.role !== 'Administrator') return;
    setLoadingReports(true);
    try {
      const [daily, monthly, topServices, barberPerf, customerVisits] = await Promise.all([
        api.getDailyRevenueReport({ date }),
        api.getMonthlyRevenueReport({ year }),
        api.getTopServicesReport({ limit: 5 }),
        api.getBarberPerformanceReport(),
        api.getCustomerVisitsReport({ limit: 10 })
      ]);
      setDailyReportData(daily);
      setMonthlyReportData(monthly);
      setTopServicesData(topServices);
      setBarberPerformanceData(barberPerf);
      setCustomerVisitsData(customerVisits);
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchSlotExceptions = async () => {
    try {
      const exceptionsData = await api.getSlotExceptions();
      setSlotExceptions(exceptionsData);
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  const checkAvailableSlots = async (barberId, dateStr, serviceId) => {
    if (!dateStr) return;
    setLoadingSlots(true);
    try {
      const data = await api.getSlots({
        barber_id: barberId || undefined,
        date: dateStr,
        service_id: serviceId || undefined
      });
      setAvailableSlots(data.available_slots || []);
      setSlotInfo(data);
    } catch (err) {
      setAvailableSlots([]);
      setSlotInfo(null);
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadDailyGrid = async (customFilter = gridFilter) => {
    if (!customFilter.date) return;
    setLoadingGrid(true);
    try {
      const data = await api.getSlots({
        barber_id: customFilter.barber_id || undefined,
        date: customFilter.date,
        service_id: customFilter.service_id || undefined
      });
      setGridData(data);
    } catch (err) {
      triggerAlert('danger', err.message);
      setGridData(null);
    } finally {
      setLoadingGrid(false);
    }
  };

  const fetchAppointments = async (filters = {}) => {
    try {
      const appointmentsData = await api.getAppointments(filters);
      setAppointments(appointmentsData);
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  // Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.login(loginEmail, loginPassword);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      triggerAlert('success', `Welcome back, ${data.user.name}!`);
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.register({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        role: registerRole
      });
      triggerAlert('success', `Staff user "${registerName}" registered successfully!`);
      setShowModal(null);
      fetchDashboardData();
      // Clear register inputs
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
    } catch (err) {
      triggerAlert('danger', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setToken('');
      setUser(null);
      setCurrentTab('dashboard');
    } catch (err) {
      // Clean up locally even if network fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken('');
      setUser(null);
    }
  };

  // CRUD Operations
  const openCreateModal = (type) => {
    setEditItem(null);
    setShowModal(type);
    if (type === 'customer') setCustomerForm({ name: '', phone: '', email: '', gender: 'Male' });
    if (type === 'barber') setBarberForm({ user_id: '', specialization: '', commission_percentage: 40, joining_date: new Date().toISOString().split('T')[0] });
    if (type === 'service') setServiceForm({ name: '', price: '', duration: '' });
    if (type === 'appointment') setAppointmentForm({ customer_id: '', service_id: '', barber_id: '', date: '', time: '', status: 'Pending', remarks: '' });
    if (type === 'staff') {
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterRole('Receptionist');
    }
  };

  const openEditModal = (type, item) => {
    setEditItem(item);
    setShowModal(type);
    if (type === 'customer') setCustomerForm({ name: item.name, phone: item.phone, email: item.email || '', gender: item.gender || 'Male' });
    if (type === 'barber') {
      const dateStr = item.joining_date ? new Date(item.joining_date).toISOString().split('T')[0] : '';
      setBarberForm({
        user_id: item.user_id?._id || item.user_id || '',
        specialization: item.specialization || '',
        commission_percentage: item.commission_percentage || 40,
        joining_date: dateStr
      });
    }
    if (type === 'service') setServiceForm({ name: item.name, price: item.price, duration: item.duration });
    if (type === 'appointment') {
      const dt = new Date(item.appointment_date);
      const dateStr = !isNaN(dt.getTime()) ? dt.toISOString().split('T')[0] : '';
      const timeStr = item.appointment_time || '';
      setAppointmentForm({
        customer_id: item.customer_id?._id || item.customer_id || '',
        service_id: item.service_id?._id || item.service_id || '',
        barber_id: item.barber_id?._id || item.barber_id || '',
        date: dateStr,
        time: timeStr,
        status: item.status || 'Pending',
        remarks: item.remarks || ''
      });
    }
  };

  const submitCustomer = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.updateCustomer(editItem._id, customerForm);
        triggerAlert('success', 'Customer profile updated successfully');
      } else {
        await api.createCustomer(customerForm);
        triggerAlert('success', 'Customer created successfully');
      }
      setShowModal(null);
      fetchDashboardData();
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to remove this customer?')) return;
    try {
      await api.deleteCustomer(id);
      triggerAlert('success', 'Customer deleted successfully');
      fetchDashboardData();
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  const submitBarber = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.updateBarber(editItem._id, barberForm);
        triggerAlert('success', 'Barber profile updated successfully');
      } else {
        await api.createBarber(barberForm);
        triggerAlert('success', 'Barber profile created successfully');
      }
      setShowModal(null);
      fetchDashboardData();
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  const deleteBarber = async (id) => {
    if (!window.confirm('Are you sure you want to remove this barber?')) return;
    try {
      await api.deleteBarber(id);
      triggerAlert('success', 'Barber deleted successfully');
      fetchDashboardData();
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  const submitService = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.updateService(editItem._id, {
          name: serviceForm.name,
          price: Number(serviceForm.price),
          duration: Number(serviceForm.duration)
        });
        triggerAlert('success', 'Service updated successfully');
      } else {
        await api.createService({
          name: serviceForm.name,
          price: Number(serviceForm.price),
          duration: Number(serviceForm.duration)
        });
        triggerAlert('success', 'Service added successfully');
      }
      setShowModal(null);
      fetchDashboardData();
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  const deleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.deleteService(id);
      triggerAlert('success', 'Service removed successfully');
      fetchDashboardData();
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  const submitAppointment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customer_id: appointmentForm.customer_id,
        service_id: appointmentForm.service_id,
        barber_id: appointmentForm.barber_id,
        appointment_date: appointmentForm.date,
        appointment_time: appointmentForm.time,
        status: appointmentForm.status || 'Pending',
        remarks: appointmentForm.remarks || null
      };
      if (editItem) {
        await api.updateAppointment(editItem._id, payload);
        triggerAlert('success', 'Appointment reservation updated successfully');
      } else {
        await api.createAppointment(payload);
        triggerAlert('success', 'Appointment booked successfully (Status: Pending)');
      }
      setShowModal(null);
      fetchDashboardData();
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  const handleQuickStatusChange = async (id, nextStatus) => {
    try {
      await api.updateAppointmentStatus(id, nextStatus);
      triggerAlert('success', `Appointment status updated to '${nextStatus}'`);
      fetchDashboardData();
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  const deleteAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.deleteAppointment(id);
      triggerAlert('success', 'Appointment canceled successfully');
      fetchDashboardData();
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  const submitException = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        date: exceptionForm.date,
        type: exceptionForm.type,
        reason: exceptionForm.reason,
        start_time: exceptionForm.start_time || null,
        end_time: exceptionForm.end_time || null,
        barber_id: exceptionForm.barber_id || null
      };
      await api.createSlotBlock(payload);
      triggerAlert('success', 'Calendar exception / holiday registered successfully');
      setExceptionForm({
        date: new Date().toISOString().split('T')[0],
        type: 'Holiday',
        start_time: '',
        end_time: '',
        reason: '',
        barber_id: ''
      });
      fetchSlotExceptions();
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  const deleteException = async (id) => {
    if (!window.confirm('Are you sure you want to remove this calendar exception / holiday?')) return;
    try {
      await api.deleteSlotException(id);
      triggerAlert('success', 'Calendar exception removed');
      fetchSlotExceptions();
    } catch (err) {
      triggerAlert('danger', err.message);
    }
  };

  // If not logged in, render Login / Register view
  if (!token || !user) {
    return (
      <div className="auth-container">
        {alert && (
          <div style={{ position: 'fixed', top: '20px', zIndex: 1100 }} className={`alert alert-${alert.type}`}>
            {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {alert.message}
          </div>
        )}
        
        <div className="auth-card card glass-panel">
          <div className="auth-header">
            <div className="auth-brand-badge">
              <Scissors size={26} />
            </div>
            <h2 className="auth-title">Salon Management System</h2>
            <p className="auth-subtitle">Log in to salon administrative panel</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)} 
                placeholder="email@example.com"
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
            <button style={{ width: '100%', marginTop: '10px' }} type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          <div className="demo-credentials-box">
            <span className="demo-title">Quick Demo Logins (Click to Autofill):</span>
            <div className="demo-chips">
              <button 
                type="button" 
                className="demo-chip"
                onClick={() => { setLoginEmail('admin@salon.com'); setLoginPassword('adminpassword123'); }}
                title="Autofill Administrator credentials"
              >
                👑 Admin
              </button>
              <button 
                type="button" 
                className="demo-chip"
                onClick={() => { setLoginEmail('barber1@salon.com'); setLoginPassword('password123'); }}
                title="Autofill Barber credentials"
              >
                ✂️ Barber
              </button>
              <button 
                type="button" 
                className="demo-chip"
                onClick={() => { setLoginEmail('receptionist@salon.com'); setLoginPassword('password123'); }}
                title="Autofill Receptionist credentials"
              >
                📋 Receptionist
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper roles variables
  const isAdmin = user?.role === 'Administrator';
  const isReceptionist = user?.role === 'Receptionist';
  const canManageScheduling = isAdmin || isReceptionist;

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Dynamic alerts */}
      {alert && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1100 }} className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {alert.message}
        </div>
      )}

      {/* Mobile Top Header (Visible on <= 900px screens) */}
      <header className="mobile-topbar">
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="mobile-brand">
          <div className="brand-logo-icon">
            <Scissors size={17} />
          </div>
          <span className="brand-title">Salon <span>System</span></span>
        </div>

        <div className="mobile-user-pill">
          <span className="user-avatar-mini">{user.name?.charAt(0).toUpperCase()}</span>
          <span className="mobile-user-role">{user.role}</span>
        </div>
      </header>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation (Scrollable & Responsive) */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-badge">
              <Scissors size={20} />
            </div>
            {!sidebarCollapsed && (
              <div className="logo-text">
                <span className="logo-title">Salon <span>Management</span></span>
                <span className="logo-subtitle">Enterprise Suite</span>
              </div>
            )}
          </div>

          {/* Desktop/Laptop Collapse Toggle */}
          <button 
            className="sidebar-collapse-btn desktop-only"
            onClick={() => setSidebarCollapsed(prev => !prev)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Mobile Close Button */}
          <button 
            className="sidebar-close-btn mobile-only"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="sidebar-scrollable">
          <ul className="nav-links">
            <li 
              className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`} 
              onClick={() => handleNavClick('dashboard')}
              title={sidebarCollapsed ? "Dashboard" : undefined}
            >
              <div className="nav-icon-wrap"><Shield size={18} /></div>
              <span>Dashboard</span>
            </li>
            
            <li 
              className={`nav-item ${currentTab === 'services' ? 'active' : ''}`} 
              onClick={() => handleNavClick('services')}
              title={sidebarCollapsed ? "Service Catalog" : undefined}
            >
              <div className="nav-icon-wrap"><Scissors size={18} /></div>
              <span>Service Catalog</span>
            </li>

            <li 
              className={`nav-item ${currentTab === 'barbers' ? 'active' : ''}`} 
              onClick={() => handleNavClick('barbers')}
              title={sidebarCollapsed ? "Barbers / Staff" : undefined}
            >
              <div className="nav-icon-wrap"><Users size={18} /></div>
              <span>Barbers / Staff</span>
            </li>

            {canManageScheduling && (
              <>
                <li 
                  className={`nav-item ${currentTab === 'customers' ? 'active' : ''}`} 
                  onClick={() => handleNavClick('customers')}
                  title={sidebarCollapsed ? "Customers" : undefined}
                >
                  <div className="nav-icon-wrap"><UserPlus size={18} /></div>
                  <span>Customers</span>
                </li>

                <li 
                  className={`nav-item ${currentTab === 'appointments' ? 'active' : ''}`} 
                  onClick={() => handleNavClick('appointments')}
                  title={sidebarCollapsed ? "Appointments" : undefined}
                >
                  <div className="nav-icon-wrap"><Calendar size={18} /></div>
                  <span>Appointments</span>
                </li>

                <li 
                  className={`nav-item ${currentTab === 'slots' ? 'active' : ''}`} 
                  onClick={() => handleNavClick('slots', loadDailyGrid)}
                  title={sidebarCollapsed ? "Time Slots & Grid" : undefined}
                >
                  <div className="nav-icon-wrap"><Clock size={18} /></div>
                  <span>Time Slots & Grid</span>
                </li>
              </>
            )}

            {(isAdmin || user?.role === 'Barber') && (
              <li 
                className={`nav-item ${currentTab === 'attendance' ? 'active' : ''}`} 
                onClick={() => handleNavClick('attendance', fetchAttendance)}
                title={sidebarCollapsed ? (user?.role === 'Barber' ? 'My Attendance' : 'Staff Attendance') : undefined}
              >
                <div className="nav-icon-wrap"><UserCheck size={18} /></div>
                <span>{user?.role === 'Barber' ? 'My Attendance' : 'Staff Attendance'}</span>
              </li>
            )}

            {(isAdmin || user?.role === 'Barber') && (
              <li 
                className={`nav-item ${currentTab === 'wages' ? 'active' : ''}`} 
                onClick={() => handleNavClick('wages', () => { fetchWagesData(); handleCalculatePayroll(selectedWageBarber, selectedWageMonth); })}
                title={sidebarCollapsed ? (user?.role === 'Barber' ? 'My Wages & Earnings' : 'Wages & Payroll') : undefined}
              >
                <div className="nav-icon-wrap"><CreditCard size={18} /></div>
                <span>{user?.role === 'Barber' ? 'My Wages & Earnings' : 'Wages & Payroll'}</span>
              </li>
            )}

            {isAdmin && (
              <li 
                className={`nav-item ${currentTab === 'reports' ? 'active' : ''}`} 
                onClick={() => handleNavClick('reports', fetchReportsData)}
                title={sidebarCollapsed ? "Analytics & Reports" : undefined}
              >
                <div className="nav-icon-wrap"><TrendingUp size={18} /></div>
                <span>Analytics & Reports</span>
              </li>
            )}


          </ul>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="server-status-pill">
            <span className="server-status-text">
              <span className="status-dot-pulse"></span>
              Server: Live (v1.0)
            </span>
            <a 
              href={DOCS_URL} 
              target="_blank" 
              rel="noreferrer" 
              className="swagger-link"
              title="Open Swagger API documentation"
            >
              Swagger <ExternalLink size={11} />
            </a>
          </div>

          <div className="user-badge">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            )}
          </div>
          
          <button 
            className="btn btn-secondary logout-btn" 
            onClick={handleLogout} 
            style={{ width: '100%' }}
            title="Logout from system"
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* TAB 1: DASHBOARD VIEW */}
        {currentTab === 'dashboard' && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Management Dashboard</h1>
                <p style={{ color: 'var(--text-muted)' }}>Realtime overview of salon stats</p>
              </div>
              <div style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
            </div>

            <div className="stats-grid">
              <div className="card stat-card">
                <div className="stat-header">
                  <span>Available Services</span>
                  <Scissors size={20} color="var(--primary)" />
                </div>
                <div className="stat-value">{services.length}</div>
              </div>

              <div className="card stat-card">
                <div className="stat-header">
                  <span>Stylists / Barbers</span>
                  <Users size={20} color="#10b981" />
                </div>
                <div className="stat-value">{barbers.length}</div>
              </div>

              {canManageScheduling && (
                <>
                  <div className="card stat-card">
                    <div className="stat-header">
                      <span>Registered Clients</span>
                      <UserPlus size={20} color="#f59e0b" />
                    </div>
                    <div className="stat-value">{customers.length}</div>
                  </div>

                  <div className="card stat-card">
                    <div className="stat-header">
                      <span>Booked Appointments</span>
                      <Calendar size={20} color="#3b82f6" />
                    </div>
                    <div className="stat-value">{appointments.length}</div>
                  </div>
                </>
              )}
            </div>

            <div className="grid-2" style={{ marginTop: '20px' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                <h3 style={{ color: '#fff', fontSize: '1.2rem' }}>Quick Actions</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Choose quick shortcuts to speed up saloon workflow management.</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {isAdmin && (
                    <>
                      <button className="btn btn-primary" onClick={() => openCreateModal('service')}>
                        <Plus size={16} /> Service
                      </button>
                      <button className="btn btn-primary" onClick={() => openCreateModal('barber')}>
                        <Plus size={16} /> Barber
                      </button>
                      <button className="btn btn-primary" onClick={() => openCreateModal('staff')}>
                        <Plus size={16} /> Staff User
                      </button>
                    </>
                  )}
                  {canManageScheduling && (
                    <>
                      <button className="btn btn-secondary" onClick={() => openCreateModal('customer')}>
                        <Plus size={16} /> Customer
                      </button>
                      <button className="btn btn-secondary" onClick={() => openCreateModal('appointment')} style={{ borderColor: 'var(--primary)' }}>
                        <Plus size={16} /> Appointment
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                <h3 style={{ color: '#fff', fontSize: '1.2rem' }}>Role Clearance Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <p><strong>System Role:</strong> <span className="badge badge-info">{user.role}</span></p>
                  <p><strong>Permissions:</strong> {
                    isAdmin ? 'Full system edit, write, delete access.' : 
                    isReceptionist ? 'Access to customers, appointment bookings, and lists.' : 
                    'View catalog items and general schedules.'
                  }</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: SERVICES VIEW */}
        {currentTab === 'services' && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Service Catalog</h1>
                <p style={{ color: 'var(--text-muted)' }}>List of hair treatments, styling, and care menu</p>
              </div>
              {isAdmin && (
                <button className="btn btn-primary" onClick={() => openCreateModal('service')}>
                  <Plus size={18} /> Add Service
                </button>
              )}
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Price ($)</th>
                    <th>Duration (Mins)</th>
                    {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 4 : 3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No services found in database.</td>
                    </tr>
                  ) : (
                    services.map(s => (
                      <tr key={s._id}>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{s.service_name || s.name}</td>
                        <td>${s.price?.toFixed(2)}</td>
                        <td>{s.duration} mins</td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn-icon edit" onClick={() => openEditModal('service', s)}><Edit size={14} /></button>
                              <button className="btn-icon delete" onClick={() => deleteService(s._id)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 3: BARBERS VIEW */}
        {currentTab === 'barbers' && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Stylist & Barber Staff</h1>
                <p style={{ color: 'var(--text-muted)' }}>Active salon service providers</p>
              </div>
              {isAdmin && (
                <button className="btn btn-primary" onClick={() => openCreateModal('barber')}>
                  <Plus size={18} /> Add Barber
                </button>
              )}
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Stylist Name</th>
                    <th>Specialization</th>
                    <th>Commission (%)</th>
                    <th>Joining Date</th>
                    <th>Status</th>
                    {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {barbers.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No barbers registered yet.</td>
                    </tr>
                  ) : (
                    barbers.map(b => (
                      <tr key={b._id}>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{b.user_id?.name || b.name}</td>
                        <td>{b.specialization || 'General Styling'}</td>
                        <td>{b.commission_percentage ? `${b.commission_percentage}%` : '40.00%'}</td>
                        <td>{b.joining_date ? new Date(b.joining_date).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <span className={`badge ${b.user_id?.status === 'Active' || b.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                            {b.user_id?.status || b.status || 'Active'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn-icon edit" onClick={() => openEditModal('barber', b)}><Edit size={14} /></button>
                              <button className="btn-icon delete" onClick={() => deleteBarber(b._id)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 4: CUSTOMERS VIEW */}
        {currentTab === 'customers' && canManageScheduling && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Registered Customers</h1>
                <p style={{ color: 'var(--text-muted)' }}>Salon client database and gender preferences</p>
              </div>
              {canManageScheduling && (
                <button className="btn btn-primary" onClick={() => openCreateModal('customer')}>
                  <Plus size={18} /> New Customer
                </button>
              )}
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Phone</th>
                    <th>Email Address</th>
                    <th>Gender</th>
                    {canManageScheduling && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={canManageScheduling ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No customers registered in database.</td>
                    </tr>
                  ) : (
                    customers.map(c => (
                      <tr key={c._id}>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{c.name}</td>
                        <td>{c.phone}</td>
                        <td>{c.email || 'N/A'}</td>
                        <td><span className="badge badge-info">{c.gender || 'Not Specified'}</span></td>
                        {canManageScheduling && (
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn-icon edit" onClick={() => openEditModal('customer', c)}><Edit size={14} /></button>
                              <button className="btn-icon delete" onClick={() => deleteCustomer(c._id)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 5: APPOINTMENTS VIEW */}
        {currentTab === 'appointments' && canManageScheduling && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Salon Appointments</h1>
                <p style={{ color: 'var(--text-muted)' }}>Lifecycle management: booking pipeline, barber assignment, and status transitions</p>
              </div>
              <button className="btn btn-primary" onClick={() => openCreateModal('appointment')}>
                <Plus size={18} /> Book Appointment
              </button>
            </div>

            {/* Multi-Criteria Filters Bar */}
            <div className="card glass-panel" style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date:</label>
                <input 
                  type="date" 
                  className="form-control" 
                  style={{ width: 'auto', padding: '6px 10px' }}
                  value={appointmentDateFilter}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setAppointmentDateFilter(newDate);
                    fetchAppointments({ date: newDate, status: appointmentStatusFilter });
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</label>
                <select 
                  className="form-control" 
                  style={{ width: 'auto', padding: '6px 10px' }}
                  value={appointmentStatusFilter}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setAppointmentStatusFilter(newStatus);
                    fetchAppointments({ date: appointmentDateFilter, status: newStatus });
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              {(appointmentDateFilter || appointmentStatusFilter) && (
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                  onClick={() => {
                    setAppointmentDateFilter('');
                    setAppointmentStatusFilter('');
                    fetchAppointments({});
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Stylist / Barber</th>
                    <th>Service Booked</th>
                    <th>Scheduled Slot</th>
                    <th>Status</th>
                    <th>Pipeline Progression</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No appointments found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    appointments.map(a => {
                      // Graceful handling of nested values
                      const custName = a.customer_id?.name || 'Unknown';
                      const custPhone = a.customer_id?.phone ? `(${a.customer_id.phone})` : '';
                      const barbName = a.barber_id?.user_id?.name || a.barber_id?.name || 'Unknown';
                      const servName = a.service_id?.service_name || a.service_id?.name || 'Unknown';
                      const servPrice = a.service_id?.price !== undefined ? `$${a.service_id.price}` : '';
                      const dateStr = a.appointment_date ? new Date(a.appointment_date).toLocaleDateString() : 'N/A';
                      
                      const renderStatusBadge = (status) => {
                        switch (status) {
                          case 'Pending':
                            return <span className="badge badge-warning">Pending</span>;
                          case 'Confirmed':
                            return <span className="badge badge-info">Confirmed</span>;
                          case 'In Progress':
                            return <span className="badge badge-purple">In Progress</span>;
                          case 'Completed':
                            return <span className="badge badge-success">Completed</span>;
                          case 'Cancelled':
                            return <span className="badge badge-danger">Cancelled</span>;
                          default:
                            return <span className="badge badge-info">{status || 'Pending'}</span>;
                        }
                      };

                      return (
                        <tr key={a._id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{custName}</div>
                            {custPhone && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{custPhone}</div>}
                          </td>
                          <td>
                            <span style={{ color: 'var(--text-light)' }}>{barbName}</span>
                          </td>
                          <td>
                            <span className="badge badge-info">{servName}</span>
                            {servPrice && <span style={{ marginLeft: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{servPrice}</span>}
                          </td>
                          <td>
                            <div>{dateStr}</div>
                            {a.appointment_time && (
                              <span className="badge badge-success" style={{ marginTop: '3px' }}>{a.appointment_time}</span>
                            )}
                          </td>
                          <td>
                            {renderStatusBadge(a.status)}
                            {a.remarks && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.remarks}>
                                📝 {a.remarks}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {a.status === 'Pending' && (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#3b82f6', color: '#60a5fa' }} 
                                  onClick={() => handleQuickStatusChange(a._id, 'Confirmed')}
                                >
                                  Confirm
                                </button>
                              )}
                              {a.status === 'Confirmed' && (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#a855f7', color: '#c084fc' }} 
                                  onClick={() => handleQuickStatusChange(a._id, 'In Progress')}
                                >
                                  Start
                                </button>
                              )}
                              {a.status === 'In Progress' && (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)' }} 
                                  onClick={() => handleQuickStatusChange(a._id, 'Completed')}
                                >
                                  Complete
                                </button>
                              )}
                              {a.status !== 'Completed' && a.status !== 'Cancelled' && (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }} 
                                  onClick={() => handleQuickStatusChange(a._id, 'Cancelled')}
                                >
                                  Cancel
                                </button>
                              )}
                              {a.status === 'Cancelled' && (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }} 
                                  onClick={() => handleQuickStatusChange(a._id, 'Pending')}
                                >
                                  Reopen
                                </button>
                              )}
                              {a.status === 'Completed' && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 500 }}>✓ Finished</span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn-icon edit" title="Edit details" onClick={() => openEditModal('appointment', a)}><Edit size={14} /></button>
                              <button className="btn-icon delete" title="Delete record" onClick={() => deleteAppointment(a._id)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB: TIME SLOTS & DAILY GRID (MODULE 6) */}
        {currentTab === 'slots' && canManageScheduling && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Time Slot Scheduling Engine & Daily Grid</h1>
                <p style={{ color: 'var(--text-muted)' }}>Real-time calendar verification, double-booking overlap checks, shift window enforcement, and holiday management</p>
              </div>
            </div>

            <div className="grid-2">
              {/* Card 1: Slot Engine Explorer */}
              <div className="card glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={20} style={{ color: 'var(--primary)' }} />
                  <span>Real-Time Barber Slot Explorer</span>
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select Date</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={gridFilter.date}
                      onChange={e => setGridFilter({ ...gridFilter, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select Barber / Stylist</label>
                    <select 
                      className="form-control"
                      value={gridFilter.barber_id}
                      onChange={e => setGridFilter({ ...gridFilter, barber_id: e.target.value })}
                    >
                      <option value="">-- Choose Barber --</option>
                      {barbers.map(b => (
                        <option key={b._id} value={b._id}>{b.user_id?.name || b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Service (for duration calculation)</label>
                  <select 
                    className="form-control"
                    value={gridFilter.service_id}
                    onChange={e => setGridFilter({ ...gridFilter, service_id: e.target.value })}
                  >
                    <option value="">-- Standard (30 mins) --</option>
                    {services.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.duration} min - ${s.price})</option>
                    ))}
                  </select>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginBottom: '20px' }}
                  onClick={() => loadDailyGrid()}
                  disabled={loadingGrid || !gridFilter.barber_id}
                >
                  {loadingGrid ? 'Calculating Slots...' : 'Inspect Open & Booked Windows'}
                </button>

                {gridData && (
                  <div>
                    {gridData.is_holiday ? (
                      <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                        <AlertTriangle size={18} />
                        <span><strong>Salon Closed:</strong> {gridData.holiday_reason}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            Operating Shift: <strong style={{ color: '#fff' }}>{gridData.shift_hours?.start} - {gridData.shift_hours?.end}</strong>
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            Open Slots: <strong style={{ color: 'var(--success)' }}>{gridData.available_slots?.length || 0}</strong>
                          </span>
                        </div>

                        {/* Open Slots Pills */}
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                            Open Available Start Times:
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                            {gridData.available_slots?.length === 0 ? (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No open windows left on this date.</span>
                            ) : (
                              gridData.available_slots?.map(slot => (
                                <span key={slot} className="badge badge-info" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
                                  {slot}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Booked Appointments */}
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                            Booked Intervals (Double-Booking Prevented):
                          </label>
                          {gridData.booked_slots?.length === 0 ? (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No existing bookings for this stylist on this date.</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {gridData.booked_slots?.map(b => (
                                <div key={b.appointment_id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                  <div>
                                    <strong style={{ color: '#fff' }}>{b.start_time} - {b.end_time}</strong>
                                    <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>({b.service_name})</span>
                                  </div>
                                  <span className="badge badge-purple">{b.customer_name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Card 2: Calendar Exceptions & Holidays Manager */}
              <div className="card glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                  <span>Salon Calendar Exceptions & Holidays</span>
                </h3>

                <form onSubmit={submitException} style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Exception Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={exceptionForm.date}
                        onChange={e => setExceptionForm({ ...exceptionForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Type</label>
                      <select 
                        className="form-control"
                        value={exceptionForm.type}
                        onChange={e => setExceptionForm({ ...exceptionForm, type: e.target.value })}
                      >
                        <option value="Holiday">Official Holiday (Full Day)</option>
                        <option value="CustomBlock">Custom Block Window</option>
                        <option value="Maintenance">Maintenance Window</option>
                      </select>
                    </div>
                  </div>

                  {exceptionForm.type !== 'Holiday' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Start Time (HH:MM)</label>
                        <input 
                          type="time" 
                          className="form-control"
                          value={exceptionForm.start_time}
                          onChange={e => setExceptionForm({ ...exceptionForm, start_time: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">End Time (HH:MM)</label>
                        <input 
                          type="time" 
                          className="form-control"
                          value={exceptionForm.end_time}
                          onChange={e => setExceptionForm({ ...exceptionForm, end_time: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Reason / Occasion</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Independence Day, Deep Cleaning, Staff Training"
                      value={exceptionForm.reason}
                      onChange={e => setExceptionForm({ ...exceptionForm, reason: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Applies To</label>
                    <select 
                      className="form-control"
                      value={exceptionForm.barber_id}
                      onChange={e => setExceptionForm({ ...exceptionForm, barber_id: e.target.value })}
                    >
                      <option value="">Whole Salon (All Barbers)</option>
                      {barbers.map(b => (
                        <option key={b._id} value={b._id}>{b.user_id?.name || b.name} (Specific)</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Register Calendar Exception
                  </button>
                </form>

                {/* Exceptions List */}
                <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--text-light)' }}>
                  Active Operational Exceptions ({slotExceptions.length})
                </h4>

                {slotExceptions.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No exceptions or holidays registered.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {slotExceptions.map(exc => (
                      <div key={exc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff' }}>
                            {exc.reason}
                            <span className="badge badge-warning" style={{ marginLeft: '8px' }}>{exc.type}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                            📅 {new Date(exc.date).toLocaleDateString()} {exc.start_time ? `• ⏰ ${exc.start_time} - ${exc.end_time}` : '• Full Day'}
                            {exc.barber_id && ` • Stylist: ${exc.barber_id?.user_id?.name || 'Stylist'}`}
                          </div>
                        </div>
                        <button className="btn-icon delete" title="Delete Exception" onClick={() => deleteException(exc._id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* TAB 5.5: ATTENDANCE & TIMECARDS VIEW (WEEK 9 INTEGRATION) */}
        {currentTab === 'attendance' && (isAdmin || user?.role === 'Barber') && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">
                  {user?.role === 'Barber' ? 'My Attendance & Timecard' : 'Staff Attendance & Timecards'}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                  Darshan University Sem-5 Backend Curriculum - Week 9 Attendance Tracking Integration & RBAC Compliance
                </p>
              </div>
              <button 
                className="btn btn-outline" 
                onClick={() => fetchAttendance()} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Clock size={16} />
                <span>Refresh Records</span>
              </button>
            </div>

            {/* Quick Punch / Digital Timecard Widget */}
            <div 
              className="glass-panel" 
              style={{ 
                padding: '24px', 
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)', 
                border: '1px solid rgba(139, 92, 246, 0.25)' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserCheck size={22} style={{ color: 'var(--primary)' }} />
                    <span>Digital Timecard Clock (Daily Shift Registration)</span>
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    System enforces single open shift per day per barber. Check-out auto-calculates total hours worked.
                  </p>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '8px' }}>
                  📅 Today: <strong style={{ color: '#fff' }}>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                </div>
              </div>

              {/* Barber Punch View */}
              {user?.role === 'Barber' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '16px 20px', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Your Current Status:</div>
                    {todayAttendance ? (
                      todayAttendance.check_out_time ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                            ✓ Shift Completed ({Number(todayAttendance.shift_duration_hours || 0).toFixed(2)} hrs)
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Clocked: {new Date(todayAttendance.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(todayAttendance.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                            ● Active Shift In Progress
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Started at: {new Date(todayAttendance.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      )
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '6px 12px' }}>
                          Not Checked In
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Click 'Check In' below to open your shift timecard.
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    {(!todayAttendance) && (
                      <button 
                        className="btn btn-success" 
                        style={{ padding: '10px 24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                        disabled={punchLoading}
                        onClick={() => handleCheckIn()}
                      >
                        <UserCheck size={18} />
                        <span>{punchLoading ? 'Punching In...' : 'Check In (Start Shift)'}</span>
                      </button>
                    )}

                    {(todayAttendance && !todayAttendance.check_out_time) && (
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '10px 24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                        disabled={punchLoading}
                        onClick={() => handleCheckOut()}
                      >
                        <LogOut size={18} />
                        <span>{punchLoading ? 'Punching Out...' : 'Check Out (End Shift)'}</span>
                      </button>
                    )}

                    {(todayAttendance && todayAttendance.check_out_time) && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        🎉 Daily shift completed. Thank you!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Administrator Punch Control View */}
              {isAdmin && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px 20px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>Select Stylist for Timecard Action:</span>
                      <select 
                        className="form-control" 
                        value={manualAttendanceBarber} 
                        onChange={(e) => setManualAttendanceBarber(e.target.value)}
                        style={{ width: '220px', padding: '8px 12px' }}
                      >
                        <option value="">-- Choose Stylist --</option>
                        {barbers.map(b => (
                          <option key={b._id} value={b._id}>{b.user_id?.name || 'Stylist'} ({b.specialization || 'General'})</option>
                        ))}
                      </select>
                    </div>

                    {manualAttendanceBarber && (() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const selectedRecord = attendanceRecords.find(r => {
                        const bId = typeof r.barber_id === 'object' ? r.barber_id?._id : r.barber_id;
                        const dStr = r.date ? new Date(r.date).toISOString().split('T')[0] : '';
                        return bId === manualAttendanceBarber && dStr === todayStr;
                      });

                      if (!selectedRecord) {
                        return (
                          <button 
                            className="btn btn-success" 
                            style={{ padding: '8px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                            disabled={punchLoading}
                            onClick={() => handleCheckIn(manualAttendanceBarber)}
                          >
                            <UserCheck size={16} />
                            <span>{punchLoading ? 'Saving...' : 'Punch In Stylist'}</span>
                          </button>
                        );
                      } else if (!selectedRecord.check_out_time) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className="badge badge-warning" style={{ padding: '6px 10px' }}>
                              In Shift since {new Date(selectedRecord.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '8px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                              disabled={punchLoading}
                              onClick={() => handleCheckOut(manualAttendanceBarber)}
                            >
                              <LogOut size={16} />
                              <span>{punchLoading ? 'Saving...' : 'Punch Out Stylist'}</span>
                            </button>
                          </div>
                        );
                      } else {
                        return (
                          <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                            ✓ Shift Completed Today ({Number(selectedRecord.shift_duration_hours || 0).toFixed(2)} hrs)
                          </span>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Attendance KPI Summary Metrics */}
            <div className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span>Total Hours Logged</span>
                  <Clock size={20} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="stat-value" style={{ color: '#10b981' }}>
                  {attendanceSummary?.total_hours_worked != null ? Number(attendanceSummary.total_hours_worked).toFixed(2) : '0.00'}
                  <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>hrs</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {user?.role === 'Barber' ? 'Your total productive shift hours' : 'Across all staff timecards'}
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span>Active Shifts Now</span>
                  <UserCheck size={20} style={{ color: '#f59e0b' }} />
                </div>
                <div className="stat-value" style={{ color: '#f59e0b' }}>
                  {attendanceSummary?.active_shifts_now || 0}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Currently clocked-in stylists</div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span>Completed Shifts</span>
                  <CheckCircle size={20} style={{ color: '#6366f1' }} />
                </div>
                <div className="stat-value" style={{ color: '#6366f1' }}>
                  {attendanceSummary?.completed_shifts || 0}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Fully checked-out timecards</div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span>{user?.role === 'Barber' ? 'Days Logged' : 'Staff Monitored'}</span>
                  <Users size={20} style={{ color: '#ec4899' }} />
                </div>
                <div className="stat-value" style={{ color: '#ec4899' }}>
                  {user?.role === 'Barber' 
                    ? attendanceRecords.length 
                    : (attendanceSummary?.staff_breakdown?.length || 0)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {user?.role === 'Barber' ? 'Total shifts recorded' : 'Stylists with shift logs'}
                </div>
              </div>
            </div>

            {/* Attendance Filter Bar */}
            <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date:</span>
                <input 
                  type="date" 
                  className="form-control" 
                  value={attendanceDateFilter} 
                  onChange={(e) => setAttendanceDateFilter(e.target.value)} 
                  style={{ width: '160px', padding: '6px 10px', fontSize: '0.85rem' }} 
                />
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Stylist:</span>
                  <select 
                    className="form-control" 
                    value={attendanceBarberFilter} 
                    onChange={(e) => setAttendanceBarberFilter(e.target.value)}
                    style={{ width: '180px', padding: '6px 10px', fontSize: '0.85rem' }}
                  >
                    <option value="">All Stylists</option>
                    {barbers.map(b => (
                      <option key={b._id} value={b._id}>{b.user_id?.name || 'Stylist'}</option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                className="btn btn-primary" 
                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                onClick={() => fetchAttendance({ date: attendanceDateFilter || undefined, barber_id: attendanceBarberFilter || undefined })}
              >
                Apply Filter
              </button>
              
              {(attendanceDateFilter || attendanceBarberFilter) && (
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                  onClick={() => {
                    setAttendanceDateFilter('');
                    setAttendanceBarberFilter('');
                    fetchAttendance({});
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Attendance Records Table */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Attendance Audit Records</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {attendanceRecords.length} record{attendanceRecords.length === 1 ? '' : 's'} found
                </span>
              </div>

              {attendanceRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <UserCheck size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ margin: 0 }}>No attendance records found for this period or query.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        <th style={{ padding: '12px 14px' }}>Stylist</th>
                        <th style={{ padding: '12px 14px' }}>Date</th>
                        <th style={{ padding: '12px 14px' }}>Check-In Time</th>
                        <th style={{ padding: '12px 14px' }}>Check-Out Time</th>
                        <th style={{ padding: '12px 14px' }}>Shift Duration</th>
                        <th style={{ padding: '12px 14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record) => {
                        const stylistName = record.barber_id?.user_id?.name || 'Stylist';
                        const stylistEmail = record.barber_id?.user_id?.email || '';
                        const recDate = record.date ? new Date(record.date).toLocaleDateString() : 'N/A';
                        const checkInFormatted = record.check_in_time 
                          ? new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : 'N/A';
                        const checkOutFormatted = record.check_out_time
                          ? new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : '—';
                        const isCompleted = !!record.check_out_time;

                        return (
                          <tr key={record._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 600, color: '#fff' }}>{stylistName}</div>
                              {stylistEmail && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stylistEmail}</div>}
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                              {recDate}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#10b981', fontWeight: 500, fontSize: '0.88rem' }}>
                              🕒 {checkInFormatted}
                            </td>
                            <td style={{ padding: '12px 14px', color: isCompleted ? '#8b5cf6' : 'var(--text-muted)', fontWeight: 500, fontSize: '0.88rem' }}>
                              {isCompleted ? `🕒 ${checkOutFormatted}` : 'In Progress'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontWeight: 700, color: isCompleted ? '#fff' : '#f59e0b' }}>
                                {record.shift_duration_hours != null ? `${Number(record.shift_duration_hours).toFixed(2)} hrs` : 'Calculating...'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              {isCompleted ? (
                                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle size={12} />
                                  Completed
                                </span>
                              ) : (
                                <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={12} />
                                  In Shift
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 5.8: AUTOMATED WAGE & COMMISSION CALCULATIONS (WEEK 10) */}
        {currentTab === 'wages' && (isAdmin || user?.role === 'Barber') && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">
                  {user?.role === 'Barber' ? 'My Wages, Commissions & Earnings' : 'Wages & Automated Payroll Subsystems'}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                  Darshan University Sem-5 Backend Curriculum - Week 10 Automated Commission Calculations & Ledger Payouts
                </p>
              </div>
              <button 
                className="btn btn-outline" 
                onClick={() => { fetchWagesData(selectedWageMonth); handleCalculatePayroll(selectedWageBarber, selectedWageMonth); }} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Clock size={16} />
                <span>Refresh Statements</span>
              </button>
            </div>

            {/* Executive Payroll KPI Summary Metrics */}
            <div className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span>{user?.role === 'Barber' ? 'My Total Earnings' : 'Total Payouts Distributed'}</span>
                  <DollarSign size={20} style={{ color: '#10b981' }} />
                </div>
                <div className="stat-value" style={{ color: '#10b981' }}>
                  ₹{wageSummary?.total_payouts_distributed != null 
                    ? Number(wageSummary.total_payouts_distributed).toLocaleString('en-IN', { minimumFractionDigits: 2 }) 
                    : (wageRecords.reduce((sum, r) => sum + Number(r.total_amount || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {user?.role === 'Barber' ? 'Combined salary + commission payouts' : `Total disbursed for ${selectedWageMonth}`}
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span>Commissions Paid</span>
                  <CreditCard size={20} style={{ color: '#8b5cf6' }} />
                </div>
                <div className="stat-value" style={{ color: '#8b5cf6' }}>
                  ₹{wageSummary?.total_commissions_paid != null 
                    ? Number(wageSummary.total_commissions_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 }) 
                    : (wageRecords.reduce((sum, r) => sum + Number(r.commission || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  From completed appointment performance shares
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span>Base Salaries</span>
                  <CheckCircle size={20} style={{ color: '#6366f1' }} />
                </div>
                <div className="stat-value" style={{ color: '#6366f1' }}>
                  ₹{wageSummary?.total_base_salaries != null 
                    ? Number(wageSummary.total_base_salaries).toLocaleString('en-IN', { minimumFractionDigits: 2 }) 
                    : (wageRecords.reduce((sum, r) => sum + Number(r.salary || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Fixed baseline salary disbursements
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span>Finalized Statements</span>
                  <Users size={20} style={{ color: '#ec4899' }} />
                </div>
                <div className="stat-value" style={{ color: '#ec4899' }}>
                  {wageSummary?.finalized_payouts_count != null ? wageSummary.finalized_payouts_count : wageRecords.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {user?.role === 'Barber' ? 'Your total wage statements on file' : `Logged in Wage_Records for ${selectedWageMonth}`}
                </div>
              </div>
            </div>

            {/* Live Commission Settlement Calculator & Payout Dispatcher */}
            <div 
              className="glass-panel" 
              style={{ 
                padding: '24px', 
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)', 
                border: '1px solid rgba(139, 92, 246, 0.25)' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={22} style={{ color: 'var(--primary)' }} />
                    <span>Automated Commission Settlement Engine</span>
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Calculates stylist share from completed service transactions: Commission = Price × Rate; Retained = Price - Commission.
                  </p>
                </div>

                {/* Calculation Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Month:</span>
                    <input 
                      type="month" 
                      className="form-control" 
                      value={selectedWageMonth} 
                      onChange={(e) => {
                        setSelectedWageMonth(e.target.value);
                        fetchWagesData(e.target.value);
                      }}
                      style={{ width: '150px', padding: '6px 10px', fontSize: '0.85rem' }} 
                    />
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Stylist:</span>
                      <select 
                        className="form-control" 
                        value={selectedWageBarber} 
                        onChange={(e) => setSelectedWageBarber(e.target.value)}
                        style={{ width: '180px', padding: '6px 10px', fontSize: '0.85rem' }}
                      >
                        <option value="">All Stylists</option>
                        {barbers.map(b => (
                          <option key={b._id} value={b._id}>{b.user_id?.name || 'Stylist'} ({b.commission_percentage || 40}%)</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '6px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    disabled={loadingWageCalc}
                    onClick={() => handleCalculatePayroll(selectedWageBarber, selectedWageMonth)}
                  >
                    <Sparkles size={14} />
                    <span>{loadingWageCalc ? 'Calculating...' : 'Run Settlement Calculation'}</span>
                  </button>
                </div>
              </div>

              {/* Render Calculated Statements */}
              {wageCalcData?.statements && wageCalcData.statements.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {wageCalcData.statements.map((stmt) => (
                    <div 
                      key={stmt.barber_id} 
                      style={{ 
                        background: 'rgba(0,0,0,0.25)', 
                        padding: '20px', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.06)' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{stmt.stylist_name}</h4>
                            <span className="badge badge-info" style={{ fontSize: '0.78rem' }}>
                              Tier: {stmt.commission_percentage}% Commission
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Specialization: {stmt.specialization}
                            </span>
                          </div>
                          {stmt.stylist_email && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{stmt.stylist_email}</div>
                          )}
                        </div>

                        <div>
                          {stmt.is_finalized ? (
                            <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                              ✓ Finalized in Ledger (Payout: ₹{Number(stmt.finalized_record?.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                            </span>
                          ) : (
                            <span className="badge badge-warning" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                              ● Pending Settlement Finalization
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Performance Figures Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed Bookings</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{stmt.completed_appointments_count}</div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross Service Sales</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>
                            ₹{Number(stmt.total_service_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stylist Commission ({stmt.commission_percentage}%)</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                            ₹{Number(stmt.total_commission).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Salon Retained Revenue</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a78bfa' }}>
                            ₹{Number(stmt.total_retained_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>

                      {/* Admin Payout Finalizer Box */}
                      {isAdmin && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>Base Salary (₹):</span>
                                <input 
                                  type="number" 
                                  className="form-control" 
                                  value={baseSalaryInput} 
                                  onChange={(e) => setBaseSalaryInput(parseFloat(e.target.value) || 0)} 
                                  style={{ width: '130px', padding: '6px 10px', fontSize: '0.85rem' }} 
                                />
                              </div>

                              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                + Commission: <strong style={{ color: '#10b981' }}>₹{Number(stmt.total_commission).toFixed(2)}</strong> = Total: <strong style={{ color: '#fff', fontSize: '1rem' }}>₹{(Number(baseSalaryInput || 0) + Number(stmt.total_commission || 0)).toFixed(2)}</strong>
                              </div>
                            </div>

                            <button 
                              className="btn btn-success" 
                              style={{ padding: '8px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                              disabled={finalizingWage}
                              onClick={() => handleFinalizePayout(stmt.barber_id, baseSalaryInput, stmt.total_commission)}
                            >
                              <CheckCircle size={16} />
                              <span>{finalizingWage ? 'Recording...' : (stmt.is_finalized ? 'Update Payout Record' : 'Finalize & Record Payout')}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Itemized Completed Bookings Table */}
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Itemized Completed Bookings ({stmt.appointments.length}):
                        </div>

                        {stmt.appointments.length === 0 ? (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No completed appointments found for {stmt.stylist_name} during {selectedWageMonth}.
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                  <th style={{ padding: '8px 10px' }}>Service</th>
                                  <th style={{ padding: '8px 10px' }}>Price (₹)</th>
                                  <th style={{ padding: '8px 10px' }}>Date</th>
                                  <th style={{ padding: '8px 10px' }}>Customer</th>
                                  <th style={{ padding: '8px 10px' }}>Stylist Share ({stmt.commission_percentage}%)</th>
                                  <th style={{ padding: '8px 10px' }}>Salon Retained Share</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stmt.appointments.map((appt) => (
                                  <tr key={appt.appointment_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '8px 10px', color: '#fff', fontWeight: 500 }}>{appt.service_name}</td>
                                    <td style={{ padding: '8px 10px', color: '#38bdf8' }}>₹{appt.service_price}</td>
                                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                                      {new Date(appt.appointment_date).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{appt.customer_name}</td>
                                    <td style={{ padding: '8px 10px', color: '#10b981', fontWeight: 600 }}>
                                      +₹{appt.stylist_commission}
                                    </td>
                                    <td style={{ padding: '8px 10px', color: '#a78bfa' }}>
                                      ₹{appt.retained_revenue}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                  <CreditCard size={44} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p style={{ margin: 0 }}>Click 'Run Settlement Calculation' above to preview live commissions for {selectedWageMonth}.</p>
                </div>
              )}
            </div>

            {/* Historical Finalized Wage Records Ledger */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>
                    Finalized Monthly Wage Records (Balance Ledger)
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Historical balance table summarizing baseline rewards + automated commission calculations (Section 3.7)
                  </p>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {wageRecords.length} finalized record{wageRecords.length === 1 ? '' : 's'}
                </span>
              </div>

              {wageRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <CreditCard size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ margin: 0 }}>No finalized wage records found for this period.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        <th style={{ padding: '12px 14px' }}>Stylist</th>
                        <th style={{ padding: '12px 14px' }}>Month</th>
                        <th style={{ padding: '12px 14px' }}>Base Salary</th>
                        <th style={{ padding: '12px 14px' }}>Commission Earned</th>
                        <th style={{ padding: '12px 14px' }}>Total Payout Amount</th>
                        <th style={{ padding: '12px 14px' }}>Finalized Date</th>
                        <th style={{ padding: '12px 14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wageRecords.map((record) => {
                        const stylistName = record.barber_id?.user_id?.name || 'Stylist';
                        const stylistEmail = record.barber_id?.user_id?.email || '';
                        const finalizedDate = record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A';

                        return (
                          <tr key={record._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 600, color: '#fff' }}>{stylistName}</div>
                              {stylistEmail && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stylistEmail}</div>}
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                              <span className="badge badge-info">{record.month}</span>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#fff', fontSize: '0.88rem' }}>
                              ₹{Number(record.salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#10b981', fontWeight: 600, fontSize: '0.88rem' }}>
                              ₹{Number(record.commission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.95rem' }}>
                                ₹{Number(record.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {finalizedDate}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={12} />
                                Settled & Paid
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 5.9: CORPORATE DASHBOARD REPORTING & ANALYTICS (WEEK 11) */}
        {currentTab === 'reports' && isAdmin && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Corporate Financial Dashboard & Analytics</h1>
                <p style={{ color: 'var(--text-muted)' }}>
                  Darshan University Sem-5 Backend Curriculum - Week 11 Enterprise Analytical Pipelines & Business Intelligence
                </p>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date:</span>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={reportDate} 
                    onChange={(e) => {
                      setReportDate(e.target.value);
                      fetchReportsData(e.target.value, reportYear);
                    }}
                    style={{ width: '150px', padding: '6px 10px', fontSize: '0.85rem' }} 
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Year:</span>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={reportYear} 
                    onChange={(e) => {
                      setReportYear(e.target.value);
                      fetchReportsData(reportDate, e.target.value);
                    }}
                    style={{ width: '100px', padding: '6px 10px', fontSize: '0.85rem' }} 
                  />
                </div>

                <button 
                  className="btn btn-primary" 
                  disabled={loadingReports}
                  onClick={() => fetchReportsData(reportDate, reportYear)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  <TrendingUp size={16} />
                  <span>{loadingReports ? 'Refreshing...' : 'Refresh Pipelines'}</span>
                </button>
              </div>
            </div>

            {/* Top Executive KPI Ribbon */}
            <div className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span>Today's Gross Sales</span>
                  <DollarSign size={20} style={{ color: '#10b981' }} />
                </div>
                <div className="stat-value" style={{ color: '#10b981' }}>
                  ₹{Number(dailyReportData?.metrics?.gross_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Retained: ₹{Number(dailyReportData?.metrics?.salon_retained_revenue || 0).toLocaleString('en-IN')} | Stylist Cut: ₹{Number(dailyReportData?.metrics?.stylist_commissions || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span>Fiscal {reportYear} Revenue</span>
                  <BarChart3 size={20} style={{ color: '#38bdf8' }} />
                </div>
                <div className="stat-value" style={{ color: '#38bdf8' }}>
                  ₹{Number(monthlyReportData?.fiscal_summary?.total_gross_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Across {monthlyReportData?.fiscal_summary?.total_completed_appointments || 0} completed bookings (Avg: ₹{Number(monthlyReportData?.fiscal_summary?.average_monthly_revenue || 0).toLocaleString('en-IN')}/mo)
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span>Client Retention Rate</span>
                  <Users size={20} style={{ color: '#f59e0b' }} />
                </div>
                <div className="stat-value" style={{ color: '#f59e0b' }}>
                  {customerVisitsData?.retention_metrics?.retention_rate_percentage || 0}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {customerVisitsData?.retention_metrics?.repeat_customers_count || 0} repeat clients of {customerVisitsData?.retention_metrics?.active_customers_with_visits || 0} serviced
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span>Top Stylist</span>
                  <Sparkles size={20} style={{ color: '#ec4899' }} />
                </div>
                <div className="stat-value" style={{ color: '#ec4899', fontSize: '1.4rem' }}>
                  {barberPerformanceData?.salon_totals?.top_stylist_name || 'N/A'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Total Salon Sales: ₹{Number(barberPerformanceData?.salon_totals?.total_stylist_sales || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Section 1: Daily Revenue Breakdown & 12-Month Fiscal Trend */}
            <div className="grid-2">
              {/* Daily Revenue & Hourly Distribution */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>Daily Operational Income</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Date: {dailyReportData?.date || reportDate} • {dailyReportData?.metrics?.completion_rate_percentage || 0}% completion rate
                    </p>
                  </div>
                  <span className="badge badge-info">
                    {dailyReportData?.metrics?.completed_appointments || 0} Completed
                  </span>
                </div>

                {/* Day status counters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Completed</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{dailyReportData?.metrics?.completed_appointments || 0}</div>
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Pending/Active</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{dailyReportData?.metrics?.pending_appointments || 0}</div>
                  </div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Cancelled</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{dailyReportData?.metrics?.cancelled_appointments || 0}</div>
                  </div>
                </div>

                {/* Hourly Visual Distribution Bar Graph */}
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Hourly Activity & Revenue (09:00 - 19:00):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dailyReportData?.hourly_breakdown?.map((h) => {
                      const maxRev = Math.max(...(dailyReportData?.hourly_breakdown?.map(x => x.hourly_revenue) || [1]), 1000);
                      const barWidth = h.hourly_revenue > 0 ? Math.min(100, Math.max(12, (h.hourly_revenue / maxRev) * 100)) : 0;

                      return (
                        <div key={h.hour} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem' }}>
                          <span style={{ width: '45px', color: 'var(--text-muted)' }}>{h.hour}</span>
                          <div style={{ flexGrow: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '18px', overflow: 'hidden', position: 'relative' }}>
                            {barWidth > 0 && (
                              <div 
                                style={{ 
                                  width: `${barWidth}%`, 
                                  height: '100%', 
                                  background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 100%)', 
                                  borderRadius: '4px',
                                  transition: 'width 0.3s ease'
                                }} 
                              />
                            )}
                          </div>
                          <span style={{ width: '70px', textAlign: 'right', fontWeight: 600, color: h.hourly_revenue > 0 ? '#10b981' : 'var(--text-muted)' }}>
                            {h.hourly_revenue > 0 ? `₹${h.hourly_revenue}` : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Monthly Fiscal Distribution */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>Fiscal {reportYear} Monthly Trend</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Peak Month: {monthlyReportData?.fiscal_summary?.highest_revenue_month} (₹{Number(monthlyReportData?.fiscal_summary?.peak_month_revenue || 0).toLocaleString('en-IN')})
                    </p>
                  </div>
                  <span className="badge badge-success">
                    Net: ₹{Number(monthlyReportData?.fiscal_summary?.total_net_salon_revenue || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 12-Month Performance Bar Chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {monthlyReportData?.monthly_breakdown?.map((m) => {
                    const maxGross = Math.max(...(monthlyReportData?.monthly_breakdown?.map(x => x.gross_revenue) || [1]), 5000);
                    const barPercent = m.gross_revenue > 0 ? Math.min(100, Math.max(8, (m.gross_revenue / maxGross) * 100)) : 0;

                    return (
                      <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem' }}>
                        <span style={{ width: '60px', color: 'var(--text-muted)' }}>{m.month}</span>
                        <div style={{ flexGrow: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '18px', overflow: 'hidden' }}>
                          {barPercent > 0 && (
                            <div 
                              style={{ 
                                width: `${barPercent}%`, 
                                height: '100%', 
                                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)', 
                                borderRadius: '4px' 
                              }} 
                            />
                          )}
                        </div>
                        <span style={{ width: '75px', textAlign: 'right', fontWeight: 600, color: m.gross_revenue > 0 ? '#fff' : 'var(--text-muted)' }}>
                          {m.gross_revenue > 0 ? `₹${Number(m.gross_revenue).toLocaleString('en-IN')}` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 2: Top-Selling Services Leaderboard & Stylist Performance Matrix */}
            <div className="grid-2">
              {/* Top Menu Services Leaderboard */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>Top-Selling Services Leaderboard</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Rank-orders menu options by purchase volume & margin
                    </p>
                  </div>
                  <span className="badge badge-info">Top 5 Catalog</span>
                </div>

                {topServicesData?.top_services?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No completed services recorded yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {topServicesData?.top_services?.map((svc) => (
                      <div 
                        key={svc.service_id} 
                        style={{ 
                          background: 'rgba(255,255,255,0.03)', 
                          padding: '12px 16px', 
                          borderRadius: '8px', 
                          border: '1px solid rgba(255,255,255,0.05)' 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>#{svc.rank}</span>
                            <span style={{ fontWeight: 600, color: '#fff' }}>{svc.service_name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {svc.duration_minutes} mins</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(svc.gross_revenue).toLocaleString('en-IN')}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>({svc.revenue_share_percentage}%)</span>
                          </div>
                        </div>

                        {/* Progress Bar of Revenue Share */}
                        <div style={{ background: 'rgba(255,255,255,0.06)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              width: `${Math.min(100, Math.max(5, svc.revenue_share_percentage))}%`, 
                              height: '100%', 
                              background: 'linear-gradient(90deg, var(--primary) 0%, #10b981 100%)', 
                              borderRadius: '3px' 
                            }} 
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>Price: ₹{svc.unit_price}</span>
                          <span>Total Bookings: <strong>{svc.total_bookings}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stylist Performance & Productivity Matrix */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>Stylist Performance & Productivity</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Appointment sales, commissions & hourly productivity
                    </p>
                  </div>
                  <span className="badge badge-info">{barberPerformanceData?.total_staff_count || 0} Stylists</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px 10px' }}>Stylist</th>
                        <th style={{ padding: '8px 10px' }}>Bookings</th>
                        <th style={{ padding: '8px 10px' }}>Sales (₹)</th>
                        <th style={{ padding: '8px 10px' }}>Commissions</th>
                        <th style={{ padding: '8px 10px' }}>Hours</th>
                        <th style={{ padding: '8px 10px' }}>Rate (₹/hr)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {barberPerformanceData?.stylists_performance?.map((b) => (
                        <tr key={b.barber_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 10px' }}>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{b.stylist_name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.specialization}</div>
                          </td>
                          <td style={{ padding: '10px 10px', color: '#fff' }}>{b.completed_appointments_count}</td>
                          <td style={{ padding: '10px 10px', fontWeight: 600, color: '#38bdf8' }}>
                            ₹{Number(b.gross_sales_generated || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 10px', color: '#10b981', fontWeight: 600 }}>
                            ₹{Number(b.accumulated_commissions || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>
                            {b.total_hours_worked} hrs
                          </td>
                          <td style={{ padding: '10px 10px' }}>
                            <span style={{ fontWeight: 700, color: b.hourly_productivity_rate > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                              ₹{b.hourly_productivity_rate}/hr
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section 3: Customer Retention & VIP Client Loyalty Analytics */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>
                    Customer Visits & Client Retention Analytics
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Tracks client return frequencies, retention percentage, and VIP client spend
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Client Spend</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
                      ₹{Number(customerVisitsData?.retention_metrics?.average_spend_per_customer || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Client Revenue</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>
                      ₹{Number(customerVisitsData?.retention_metrics?.total_customer_spend || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* VIP Clients Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      <th style={{ padding: '12px 14px' }}>Client Name</th>
                      <th style={{ padding: '12px 14px' }}>Contact Phone</th>
                      <th style={{ padding: '12px 14px' }}>Total Completed Visits</th>
                      <th style={{ padding: '12px 14px' }}>Lifetime Spend (₹)</th>
                      <th style={{ padding: '12px 14px' }}>Last Visit Date</th>
                      <th style={{ padding: '12px 14px' }}>Loyalty Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerVisitsData?.top_loyal_customers?.map((cust) => (
                      <tr key={cust.customer_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{cust.customer_name || 'Client'}</div>
                          {cust.customer_email && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cust.customer_email}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                          {cust.customer_phone || 'N/A'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className="badge badge-info" style={{ fontWeight: 600 }}>
                            {cust.visit_count} visit{cust.visit_count === 1 ? '' : 's'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#10b981', fontSize: '0.92rem' }}>
                          ₹{Number(cust.total_spent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {cust.last_visit ? new Date(cust.last_visit).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {cust.visit_count >= 3 ? (
                            <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Sparkles size={12} />
                              Gold VIP
                            </span>
                          ) : cust.visit_count > 1 ? (
                            <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              Repeat Client
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                              First-Time
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </main>


      {/* DYNAMIC FORM MODALS */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content card glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            <h3 className="modal-title">
              {editItem ? 'Edit' : 'Create'} {showModal.charAt(0).toUpperCase() + showModal.slice(1)}
            </h3>

            {/* Service Form */}
            {showModal === 'service' && (
              <form onSubmit={submitService}>
                <div className="form-group">
                  <label className="form-label">Service Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={serviceForm.name} 
                    onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} 
                    placeholder="e.g. Haircut & Trim"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control" 
                    value={serviceForm.price} 
                    onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })} 
                    placeholder="25.00"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={serviceForm.duration} 
                    onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })} 
                    placeholder="30"
                    required 
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            )}

            {/* Barber Form */}
            {showModal === 'barber' && (
              <form onSubmit={submitBarber}>
                <div className="form-group">
                  <label className="form-label">Select Staff User (Role: Barber)</label>
                  <select 
                    className="form-control" 
                    value={barberForm.user_id} 
                    onChange={e => setBarberForm({ ...barberForm, user_id: e.target.value })}
                    required
                    disabled={!!editItem}
                  >
                    <option value="">-- Choose User --</option>
                    {staff.filter(s => s.role === 'Barber' && (!barbers.some(b => (b.user_id?._id || b.user_id) === s._id) || (editItem && (editItem.user_id?._id || editItem.user_id) === s._id))).map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={barberForm.specialization} 
                    onChange={e => setBarberForm({ ...barberForm, specialization: e.target.value })} 
                    placeholder="e.g. Haircut, Hair coloring"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Commission Percentage (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-control" 
                    value={barberForm.commission_percentage} 
                    onChange={e => setBarberForm({ ...barberForm, commission_percentage: parseFloat(e.target.value) || 0 })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Joining Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={barberForm.joining_date} 
                    onChange={e => setBarberForm({ ...barberForm, joining_date: e.target.value })} 
                    required 
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            )}

            {/* Customer Form */}
            {showModal === 'customer' && (
              <form onSubmit={submitCustomer}>
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={customerForm.name} 
                    onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} 
                    placeholder="e.g. Rachel Green"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    value={customerForm.phone} 
                    onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} 
                    placeholder="+1 555-0199"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address (Optional)</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={customerForm.email} 
                    onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} 
                    placeholder="rachel@example.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender Preference</label>
                  <select 
                    className="form-control" 
                    value={customerForm.gender} 
                    onChange={e => setCustomerForm({ ...customerForm, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            )}

            {/* Appointment Form */}
            {showModal === 'appointment' && (
              <form onSubmit={submitAppointment}>
                <div className="form-group">
                  <label className="form-label">Select Customer</label>
                  <select 
                    className="form-control" 
                    value={appointmentForm.customer_id} 
                    onChange={e => setAppointmentForm({ ...appointmentForm, customer_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Barber / Stylist</label>
                  <select 
                    className="form-control" 
                    value={appointmentForm.barber_id} 
                    onChange={e => setAppointmentForm({ ...appointmentForm, barber_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Stylist --</option>
                    {barbers.filter(b => b.user_id?.status === 'Active' || b.status === 'Active' || b._id === appointmentForm.barber_id).map(b => (
                      <option key={b._id} value={b._id}>{b.user_id?.name || b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Service</label>
                  <select 
                    className="form-control" 
                    value={appointmentForm.service_id} 
                    onChange={e => setAppointmentForm({ ...appointmentForm, service_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Service --</option>
                    {services.map(s => (
                      <option key={s._id} value={s._id}>{s.name} (${s.price})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Appointment Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={appointmentForm.date} 
                    onChange={e => {
                      const newDate = e.target.value;
                      setAppointmentForm({ ...appointmentForm, date: newDate });
                      checkAvailableSlots(appointmentForm.barber_id, newDate, appointmentForm.service_id);
                    }}
                    required 
                  />
                </div>

                {slotInfo?.is_holiday && (
                  <div className="alert alert-danger" style={{ marginBottom: '14px', fontSize: '0.85rem' }}>
                    <AlertTriangle size={16} />
                    <span><strong>Salon Closed:</strong> {slotInfo.holiday_reason}</span>
                  </div>
                )}

                {availableSlots.length > 0 && !slotInfo?.is_holiday && (
                  <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                        Available Open Windows ({availableSlots.length} slots, shift 09:00 - 19:00):
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          className={`badge ${appointmentForm.time === slot ? 'badge-success' : 'badge-info'}`}
                          style={{
                            cursor: 'pointer',
                            padding: '5px 8px',
                            fontSize: '0.78rem',
                            border: appointmentForm.time === slot ? '1px solid var(--success)' : '1px solid rgba(59, 130, 246, 0.3)'
                          }}
                          onClick={() => setAppointmentForm({ ...appointmentForm, time: slot })}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Appointment Time</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={appointmentForm.time} 
                    onChange={e => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lifecycle Status</label>
                  <select 
                    className="form-control" 
                    value={appointmentForm.status} 
                    onChange={e => setAppointmentForm({ ...appointmentForm, status: e.target.value })}
                  >
                    <option value="Pending">Pending (Default Initial Status)</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / Special Notes (Optional)</label>
                  <textarea 
                    className="form-control" 
                    rows={2}
                    value={appointmentForm.remarks || ''} 
                    onChange={e => setAppointmentForm({ ...appointmentForm, remarks: e.target.value })} 
                    placeholder="e.g. VIP client, preferred haircut style, allergies"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editItem ? 'Save Changes' : 'Book Appointment'}</button>
                </div>
              </form>
            )}

            {/* Staff Registration Form (Admin Only) */}
            {showModal === 'staff' && (
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={registerName} 
                    onChange={(e) => setRegisterName(e.target.value)} 
                    placeholder="e.g. John Doe"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={registerEmail} 
                    onChange={(e) => setRegisterEmail(e.target.value)} 
                    placeholder="email@example.com"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={registerPassword} 
                    onChange={(e) => setRegisterPassword(e.target.value)} 
                    placeholder="Min 6 characters"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">System Role Designation</label>
                  <select 
                    className="form-control" 
                    value={registerRole} 
                    onChange={(e) => setRegisterRole(e.target.value)}
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Barber">Barber Staff</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Register Staff'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
