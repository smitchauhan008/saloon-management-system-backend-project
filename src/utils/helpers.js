/**
 * Darshan University - Salon Management System (2501CS402)
 * Shared Helper Routines & Calculation Utilities (SRS Section 2.1)
 */

/**
 * Converts "HH:MM" string to minutes from start of day
 * @param {string} timeStr - "HH:MM"
 * @returns {number} minutes
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts minutes from start of day to "HH:MM" format
 * @param {number} totalMinutes
 * @returns {string} "HH:MM"
 */
function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Calculates stylist commission and salon retained share
 * Example from SRS Module 5.8: Haircut ₹300, 40% commission:
 * Stylist Share = 300 * 0.40 = ₹120
 * Salon Share = 300 - 120 = ₹180
 * @param {number} servicePrice
 * @param {number} commissionPercentage
 * @returns {{ stylistCommission: number, salonRetained: number }}
 */
function calculateCommission(servicePrice, commissionPercentage) {
  const price = Number(servicePrice) || 0;
  const rate = Number(commissionPercentage) || 0;
  const stylistCommission = Math.round((price * (rate / 100)) * 100) / 100;
  const salonRetained = Math.round((price - stylistCommission) * 100) / 100;

  return {
    stylistCommission,
    salonRetained
  };
}

/**
 * Formats ISO date to YYYY-MM-DD
 * @param {Date|string} date
 * @returns {string} YYYY-MM-DD
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Formats ISO date to YYYY-MM
 * @param {Date|string} date
 * @returns {string} YYYY-MM
 */
function formatMonth(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

module.exports = {
  timeToMinutes,
  minutesToTime,
  calculateCommission,
  formatDate,
  formatMonth
};
