import * as jalaali from "jalaali-js";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند",
];

const WEEKDAY_NAMES = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه",
  "چهارشنبه", "پنجشنبه", "جمعه",
];

export function toPersianDigits(str: string | number): string {
  return String(str).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d)]);
}

export function getTodayJalali(): { jy: number; jm: number; jd: number } {
  const now = new Date();
  return jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function formatJalaliDate(jy: number, jm: number, jd: number): string {
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

export function getTodayJalaliStr(): string {
  const { jy, jm, jd } = getTodayJalali();
  return formatJalaliDate(jy, jm, jd);
}

export function getJalaliMonthName(jm: number): string {
  return JALALI_MONTHS[jm - 1] || "";
}

export function getWeekdayName(dayOfWeek: number): string {
  return WEEKDAY_NAMES[dayOfWeek] || "";
}

export function getWeekdayNames(): string[] {
  return WEEKDAY_NAMES;
}

// Get dayOfWeek (0=Saturday..6=Friday) from a JS Date
export function getDayOfWeekFromDate(date: Date): number {
  // JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const jsDay = date.getDay();
  // Convert: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
  return (jsDay + 1) % 7;
}

// Get dayOfWeek from Jalali date string "1403/01/15"
export function getDayOfWeekFromJalali(dateStr: string): number {
  const parts = dateStr.split("/").map(Number);
  const greg = jalaali.toGregorian(parts[0], parts[1], parts[2]);
  const date = new Date(greg.gy, greg.gm - 1, greg.gd);
  return getDayOfWeekFromDate(date);
}

export function jalaliToGregorian(dateStr: string): { gy: number; gm: number; gd: number } {
  const parts = dateStr.split("/").map(Number);
  return jalaali.toGregorian(parts[0], parts[1], parts[2]);
}

export function gregorianToJalali(gy: number, gm: number, gd: number): string {
  const { jy, jm, jd } = jalaali.toJalaali(gy, gm, gd);
  return formatJalaliDate(jy, jm, jd);
}

// Get all days in a Jalali month
export function getJalaliMonthDays(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

// Get formatted Jalali date with month name
export function getFormattedJalaliDate(): string {
  const { jy, jm, jd } = getTodayJalali();
  return `${jd} ${JALALI_MONTHS[jm - 1]} ${jy}`;
}

// Parse "HH:MM" to total minutes from midnight
export function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Convert total minutes to "HH:MM" string
export function minutesToTime(mins: number): string {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Calculate attendance metrics
export function calculateAttendance(
  checkIn: string,
  checkOut: string,
  scheduleStart: string,
  scheduleEnd: string
): {
  delayMinutes: number;
  overtimeMinutes: number;
  deficitMinutes: number;
  totalWorkedMinutes: number;
} {
  const inMins = timeToMinutes(checkIn);
  const outMins = timeToMinutes(checkOut);
  const schedStartMins = timeToMinutes(scheduleStart);
  const schedEndMins = timeToMinutes(scheduleEnd);

  const totalWorkedMinutes = Math.max(0, outMins - inMins);
  const expectedMinutes = Math.max(0, schedEndMins - schedStartMins);

  // Delay: came in after schedule start
  const delayMinutes = Math.max(0, inMins - schedStartMins);

  // Overtime: worked more than expected
  const overtimeMinutes = Math.max(0, totalWorkedMinutes - expectedMinutes);

  // Deficit: worked less than expected (not counting overtime scenarios)
  const deficitMinutes = Math.max(0, expectedMinutes - totalWorkedMinutes);

  return { delayMinutes, overtimeMinutes, deficitMinutes, totalWorkedMinutes };
}

export { JALALI_MONTHS, WEEKDAY_NAMES };
