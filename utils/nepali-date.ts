const BS_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan",
  "Bhadra", "Ashwin", "Kartik", "Mangsir",
  "Poush", "Magh", "Falgun", "Chaitra"
];

const BS_MONTHS_NP = [
  "बैशाख", "जेठ", "असार", "साउन",
  "भदौ", "असोज", "कार्तिक", "मंसिर",
  "पुस", "माघ", "फागुन", "चैत"
];

const AD_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// BS year -> days in each month (Baisakh to Chaitra)
const BS_MONTH_DAYS: Record<number, number[]> = {
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2077: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2078: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2079: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2080: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2086: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
};

// Reference: 1 Baisakh 2075 BS = 14 April 2018 AD
const REF_BS = { year: 2075, month: 0, day: 1 }; // 0-indexed month
const REF_AD = new Date(2018, 3, 14); // April 14, 2018

function getTotalDaysFromRef(bsYear: number, bsMonth: number, bsDay: number): number {
  let totalDays = 0;
  for (let y = REF_BS.year; y < bsYear; y++) {
    const monthDays = BS_MONTH_DAYS[y] || BS_MONTH_DAYS[2081];
    totalDays += monthDays.reduce((a, b) => a + b, 0);
  }
  const monthDays = BS_MONTH_DAYS[bsYear] || BS_MONTH_DAYS[2081];
  for (let m = 0; m < bsMonth; m++) {
    totalDays += monthDays[m];
  }
  totalDays += bsDay - 1;
  return totalDays;
}

export function bsToAd(bsYear: number, bsMonth: number, bsDay: number): Date {
  const refDays = getTotalDaysFromRef(REF_BS.year, REF_BS.month, REF_BS.day);
  const targetDays = getTotalDaysFromRef(bsYear, bsMonth, bsDay);
  const diffDays = targetDays - refDays;
  const result = new Date(REF_AD);
  result.setDate(result.getDate() + diffDays);
  return result;
}

export function adToBs(date: Date): { year: number; month: number; day: number } {
  const refDate = new Date(REF_AD);
  const diffMs = date.getTime() - refDate.getTime();
  let diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let year = REF_BS.year;
  let month = REF_BS.month;
  let day = REF_BS.day;

  while (diffDays > 0) {
    const monthDays = BS_MONTH_DAYS[year] || BS_MONTH_DAYS[2081];
    const remaining = monthDays[month] - day + 1;
    if (diffDays < remaining) {
      day += diffDays;
      diffDays = 0;
    } else {
      diffDays -= remaining;
      day = 1;
      month++;
      if (month >= 12) {
        month = 0;
        year++;
      }
    }
  }

  return { year, month, day };
}

export function formatDate(dateStr: string, useBS: boolean): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    if (!useBS) {
      const d = date.getDate().toString().padStart(2, "0");
      const m = AD_MONTHS[date.getMonth()];
      const y = date.getFullYear();
      return `${d} ${m} ${y}`;
    }

    const bs = adToBs(date);
    const d = bs.day.toString().padStart(2, "0");
    const m = BS_MONTHS[bs.month];
    const y = bs.year;
    return `${d} ${m} ${y}`;
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string, useBS: boolean): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    if (!useBS) {
      const d = date.getDate().toString().padStart(2, "0");
      const m = AD_MONTHS[date.getMonth()];
      return `${d} ${m}`;
    }

    const bs = adToBs(date);
    const d = bs.day.toString().padStart(2, "0");
    const m = BS_MONTHS[bs.month];
    return `${d} ${m}`;
  } catch {
    return dateStr;
  }
}

export function getCurrentBSDate(): { year: number; month: number; day: number } {
  return adToBs(new Date());
}

export function getBSMonthName(month: number, nepali = false): string {
  return nepali ? BS_MONTHS_NP[month] : BS_MONTHS[month];
}

export function getBSYear(): number {
  return adToBs(new Date()).year;
}

export function getADYear(): number {
  return new Date().getFullYear();
}

export function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export { BS_MONTHS, AD_MONTHS };
