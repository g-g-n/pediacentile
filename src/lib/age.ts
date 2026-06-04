export type AgeInput = {
  dateOfBirth?: string;
  measurementDate: string;
  years?: number;
  months?: number;
};

export type AgeResult = {
  years: number;
  months: number;
  totalMonths: number;
  decimalYears: number;
  label: string;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function calculateAge(input: AgeInput): AgeResult | null {
  if (input.dateOfBirth) {
    const dob = new Date(`${input.dateOfBirth}T00:00:00`);
    const measured = new Date(`${input.measurementDate}T00:00:00`);
    if (Number.isNaN(dob.getTime()) || Number.isNaN(measured.getTime()) || dob > measured) {
      return null;
    }

    const days = Math.max(0, Math.round((measured.getTime() - dob.getTime()) / MS_PER_DAY));
    const decimalYears = days / 365.25;
    return fromDecimalYears(decimalYears);
  }

  const totalMonths = (input.years ?? 0) * 12 + (input.months ?? 0);
  if (totalMonths <= 0) {
    return null;
  }

  return fromTotalMonths(totalMonths);
}

export function fromDecimalYears(decimalYears: number): AgeResult {
  return fromTotalMonths(Math.round(decimalYears * 12));
}

export function fromTotalMonths(totalMonths: number): AgeResult {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const decimalYears = totalMonths / 12;
  const yearText = `${years} year${years === 1 ? '' : 's'}`;
  const monthText = months > 0 ? ` ${months} month${months === 1 ? '' : 's'}` : '';
  return {
    years,
    months,
    totalMonths,
    decimalYears,
    label: `${yearText}${monthText}`,
  };
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
