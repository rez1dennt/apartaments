function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function localToday() {
  // Reservation dates are local calendar dates at the property, not UTC dates.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function validateInquiry(data, today = localToday(), apartmentIds = null) {
  const errors = {};
  const name = String(data.name ?? '').trim();
  const email = String(data.email ?? '').trim();
  const phone = String(data.phone ?? '').trim();
  if (name.length < 2 || name.length > 100 || /[\r\n]/.test(name)) errors.name = 'name';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'email';
  if (phone && (!/^[+\d\s().-]{5,40}$/.test(phone) || /[\r\n]/.test(phone))) errors.phone = 'phone';
  if (String(data.message ?? '').length > 2000) errors.message = 'message';
  if (data.apartment) {
    const allowed = apartmentIds === null
      ? /^(?:[1-9]|1[0-5])$/.test(String(data.apartment))
      : apartmentIds.map(String).includes(String(data.apartment));
    if (!allowed) errors.apartment = 'apartment';
  }
  const arrival = String(data.arrival ?? '');
  const departure = String(data.departure ?? '');
  if (arrival && (!validDate(arrival) || arrival < today)) errors.arrival = 'date';
  if (departure && (!validDate(departure) || departure < today)) errors.departure = 'date';
  if (arrival && !departure) errors.departure = 'datePair';
  if (departure && !arrival) errors.arrival = 'datePair';
  if (arrival && departure && !errors.arrival && !errors.departure && departure <= arrival) errors.departure = 'dateOrder';
  if (data.consent !== true) errors.consent = 'consent';
  return errors;
}
