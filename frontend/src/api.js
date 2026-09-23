const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper to get authorization headers
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Handle response status and JSON conversion
const handleResponse = async (response) => {
  if (response.status === 204) {
    return { success: true };
  }
  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || resData.error?.message || 'Something went wrong');
  }
  return resData.data !== undefined ? resData.data : resData;
};

export const api = {
  // Auth endpoints
  async login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async register(userData) {
    const res = await fetch(`${API_URL}/users/staff`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  async getStaff() {
    const res = await fetch(`${API_URL}/users/staff`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async logout() {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders()
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return handleResponse(res);
  },

  // Customer endpoints
  async getCustomers() {
    const res = await fetch(`${API_URL}/customers`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createCustomer(customerData) {
    const res = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(customerData)
    });
    return handleResponse(res);
  },

  async updateCustomer(id, customerData) {
    const res = await fetch(`${API_URL}/customers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(customerData)
    });
    return handleResponse(res);
  },

  async deleteCustomer(id) {
    const res = await fetch(`${API_URL}/customers/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Barber endpoints
  async getBarbers() {
    const res = await fetch(`${API_URL}/barbers`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createBarber(barberData) {
    const res = await fetch(`${API_URL}/barbers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(barberData)
    });
    return handleResponse(res);
  },

  async updateBarber(id, barberData) {
    const res = await fetch(`${API_URL}/barbers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(barberData)
    });
    return handleResponse(res);
  },

  async deleteBarber(id) {
    const res = await fetch(`${API_URL}/barbers/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Service endpoints
  async getServices() {
    const res = await fetch(`${API_URL}/services`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createService(serviceData) {
    const res = await fetch(`${API_URL}/services`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(serviceData)
    });
    return handleResponse(res);
  },

  async updateService(id, serviceData) {
    const res = await fetch(`${API_URL}/services/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(serviceData)
    });
    return handleResponse(res);
  },

  async deleteService(id) {
    const res = await fetch(`${API_URL}/services/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Appointment endpoints (Week 7 Lifecycle)
  async getAppointments(filters = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_URL}/appointments${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createAppointment(appointmentData) {
    const res = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(appointmentData)
    });
    return handleResponse(res);
  },

  async updateAppointment(id, appointmentData) {
    const res = await fetch(`${API_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(appointmentData)
    });
    return handleResponse(res);
  },

  async updateAppointmentStatus(id, status, remarks) {
    const res = await fetch(`${API_URL}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, remarks })
    });
    return handleResponse(res);
  },

  async deleteAppointment(id) {
    const res = await fetch(`${API_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Week 8: Advanced Slot Conflict Engine endpoints
  async getSlots(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_URL}/slots${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createSlotBlock(blockData) {
    const res = await fetch(`${API_URL}/slots`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(blockData)
    });
    return handleResponse(res);
  },

  async getSlotExceptions(type) {
    const query = type ? `?type=${type}` : '';
    const res = await fetch(`${API_URL}/slots/exceptions${query}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async deleteSlotException(id) {
    const res = await fetch(`${API_URL}/slots/exceptions/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Week 9: Employee Attendance Tracker endpoints
  async getAttendance(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_URL}/attendance${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async checkIn(data = {}) {
    const res = await fetch(`${API_URL}/attendance/checkin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async checkOut(data = {}) {
    const res = await fetch(`${API_URL}/attendance/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getAttendanceSummary(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_URL}/attendance/summary${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Week 10: Automatic Commission & Payroll Subsystems
  async getWages(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_URL}/wages${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getMyWages() {
    const res = await fetch(`${API_URL}/wages/my-wages`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getWageById(id) {
    const res = await fetch(`${API_URL}/wages/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async calculatePayroll(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_URL}/wages/calculate${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async finalizePayroll(data) {
    const res = await fetch(`${API_URL}/wages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getPayrollSummary(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_URL}/wages/summary${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Week 11: Enterprise Dashboard Analytical Pipelines
  async getDailyRevenueReport(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_URL}/reports/daily-revenue${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getMonthlyRevenueReport(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_URL}/reports/monthly-revenue${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getTopServicesReport(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_URL}/reports/top-services${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getBarberPerformanceReport() {
    const res = await fetch(`${API_URL}/reports/barber-performance`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getCustomerVisitsReport(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_URL}/reports/customer-visits${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getHealth() {
    const res = await fetch(`${API_URL}/health`);
    return handleResponse(res);
  }
};



