import { bmiBoys, BMI_BOYS_SAMPLE_MODE } from '../data/bmiBoys';
import { bmiGirls, BMI_GIRLS_SAMPLE_MODE } from '../data/bmiGirls';

export type Sex = 'male' | 'female';

export type BmiLmsPoint = {
  ageMonths: number;
  l: number;
  m: number;
  s: number;
};

export type BmiResult = {
  bmi: number;
  zScore: number;
  percentile: number;
  category: string;
  sampleMode: boolean;
  lms: BmiLmsPoint;
};

export function calculateBmi(weightKg: number, heightCm: number): number {
  return weightKg / (heightCm / 100) ** 2;
}

export function getBmiResult(sex: Sex, ageMonths: number, heightCm: number, weightKg: number): BmiResult | null {
  if (ageMonths < 24 || ageMonths > 228 || heightCm <= 0 || weightKg <= 0) {
    return null;
  }

  const bmi = calculateBmi(weightKg, heightCm);
  const lms = interpolateLms(sex === 'male' ? bmiBoys : bmiGirls, ageMonths);
  if (!lms) {
    return null;
  }

  const zScore = lms.l === 0
    ? Math.log(bmi / lms.m) / lms.s
    : (((bmi / lms.m) ** lms.l) - 1) / (lms.l * lms.s);
  const percentile = normalCdf(zScore) * 100;

  return {
    bmi,
    zScore,
    percentile,
    category: bmiCategory(ageMonths, zScore),
    sampleMode: sex === 'male' ? BMI_BOYS_SAMPLE_MODE : BMI_GIRLS_SAMPLE_MODE,
    lms,
  };
}

export function bmiAtPercentile(sex: Sex, ageMonths: number, percentile: number): number | null {
  const lms = interpolateLms(sex === 'male' ? bmiBoys : bmiGirls, ageMonths);
  if (!lms) {
    return null;
  }

  const z = inverseNormalCdf(percentile / 100);
  return lms.l === 0
    ? lms.m * Math.exp(lms.s * z)
    : lms.m * (1 + lms.l * lms.s * z) ** (1 / lms.l);
}

export function bmiAtZScore(sex: Sex, ageMonths: number, zScore: number): number | null {
  const lms = interpolateLms(sex === 'male' ? bmiBoys : bmiGirls, ageMonths);
  if (!lms) {
    return null;
  }

  return lms.l === 0
    ? lms.m * Math.exp(lms.s * zScore)
    : lms.m * (1 + lms.l * lms.s * zScore) ** (1 / lms.l);
}

export function buildBmiCurve(sex: Sex): Array<Record<string, number>> {
  const rows = sex === 'male' ? bmiBoys : bmiGirls;
  return rows.map((row) => ({
    ageYears: row.ageMonths / 12,
    sdMinus2: bmiAtZScore(sex, row.ageMonths, -2) ?? 0,
    median: bmiAtZScore(sex, row.ageMonths, 0) ?? 0,
    sdPlus1: bmiAtZScore(sex, row.ageMonths, 1) ?? 0,
    sdPlus2: bmiAtZScore(sex, row.ageMonths, 2) ?? 0,
    sdPlus3: bmiAtZScore(sex, row.ageMonths, 3) ?? 0,
  }));
}

function interpolateLms(data: BmiLmsPoint[], ageMonths: number): BmiLmsPoint | null {
  const lower = [...data].reverse().find((point) => point.ageMonths <= ageMonths);
  const upper = data.find((point) => point.ageMonths >= ageMonths);
  if (!lower || !upper) {
    return null;
  }
  if (lower.ageMonths === upper.ageMonths) {
    return lower;
  }

  const ratio = (ageMonths - lower.ageMonths) / (upper.ageMonths - lower.ageMonths);
  return {
    ageMonths,
    l: lower.l + (upper.l - lower.l) * ratio,
    m: lower.m + (upper.m - lower.m) * ratio,
    s: lower.s + (upper.s - lower.s) * ratio,
  };
}

function bmiCategory(ageMonths: number, zScore: number): string {
  if (zScore < -3) return 'Severe thinness range';
  if (zScore < -2) return 'Thinness range';

  if (ageMonths <= 60) {
    if (zScore > 3) return 'Obesity range';
    if (zScore > 2) return 'Overweight range';
    return 'Healthy BMI-for-age range';
  }

  if (zScore > 2) return 'Obesity range';
  if (zScore > 1) return 'Overweight range';
  return 'Healthy BMI-for-age range';
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function erf(x: number): number {
  const sign = Math.sign(x);
  const value = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * value);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-value * value);
  return sign * y;
}

function inverseNormalCdf(p: number): number {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const low = 0.02425;
  const high = 1 - low;

  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= high) {
    const q = p - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
      / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
    / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}
