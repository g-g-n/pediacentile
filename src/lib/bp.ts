import { bpBoys, BP_BOYS_SAMPLE_MODE } from '../data/bpBoys';
import { bpGirls, BP_GIRLS_SAMPLE_MODE } from '../data/bpGirls';
import type { Sex } from './bmi';

export type BpCategory = 'Normal' | 'Elevated BP' | 'Stage 1 hypertension' | 'Stage 2 hypertension';

export type BpReferenceRow = {
  ageYears: number;
  heightPercentile: number;
  heightCm: number;
  systolic90: number;
  systolic95: number;
  systolic95Plus12: number;
  diastolic90: number;
  diastolic95: number;
  diastolic95Plus12: number;
};

export type BpResult = {
  category: BpCategory;
  systolicCategory: BpCategory;
  diastolicCategory: BpCategory;
  approximatePercentileText: string;
  heightPercentile: number;
  thresholds: BpReferenceRow;
  sampleMode: boolean;
};

export function estimateHeightPercentile(sex: Sex, ageYears: number, heightCm: number): number {
  const data = sex === 'male' ? bpBoys : bpGirls;
  const roundedAge = clamp(Math.round(ageYears), 1, 12);
  const ageRows = data.filter((row) => row.ageYears === roundedAge).sort((a, b) => a.heightCm - b.heightCm);
  if (ageRows.length === 0) {
    return 50;
  }

  const lower = [...ageRows].reverse().find((row) => row.heightCm <= heightCm) ?? ageRows[0];
  const upper = ageRows.find((row) => row.heightCm >= heightCm) ?? ageRows[ageRows.length - 1];
  if (lower.heightCm === upper.heightCm) {
    return lower.heightPercentile;
  }

  const ratio = (heightCm - lower.heightCm) / (upper.heightCm - lower.heightCm);
  return clamp(interpolate(lower.heightPercentile, upper.heightPercentile, ratio), 1, 99);
}

export function getBpResult(
  sex: Sex,
  ageYearsDecimal: number,
  heightCm: number,
  systolic: number,
  diastolic: number,
): BpResult | null {
  if (ageYearsDecimal < 1 || ageYearsDecimal > 19 || heightCm <= 0 || systolic <= 0 || diastolic <= 0) {
    return null;
  }

  const heightPercentile = estimateHeightPercentile(sex, ageYearsDecimal, heightCm);
  const thresholds = getThresholds(sex, ageYearsDecimal, heightPercentile);
  if (!thresholds) {
    return null;
  }

  const systolicCategory = classifyBpValue(ageYearsDecimal, systolic, true, thresholds);
  const diastolicCategory = classifyBpValue(ageYearsDecimal, diastolic, false, thresholds);
  const category = worseCategory(systolicCategory, diastolicCategory);

  return {
    category,
    systolicCategory,
    diastolicCategory,
    approximatePercentileText: percentileText(category),
    heightPercentile,
    thresholds,
    sampleMode: sex === 'male' ? BP_BOYS_SAMPLE_MODE : BP_GIRLS_SAMPLE_MODE,
  };
}

export function getThresholds(sex: Sex, ageYearsDecimal: number, heightPercentile: number): BpReferenceRow | null {
  if (ageYearsDecimal >= 13) {
    return {
      ageYears: Math.round(ageYearsDecimal),
      heightPercentile,
      heightCm: 0,
      systolic90: 120,
      systolic95: 130,
      systolic95Plus12: 140,
      diastolic90: 80,
      diastolic95: 80,
      diastolic95Plus12: 90,
    };
  }

  const data = sex === 'male' ? bpBoys : bpGirls;
  const roundedAge = clamp(Math.round(ageYearsDecimal), 1, 12);
  const ageRows = data.filter((row) => row.ageYears === roundedAge).sort((a, b) => a.heightPercentile - b.heightPercentile);
  if (ageRows.length === 0) {
    return null;
  }

  const lower = [...ageRows].reverse().find((row) => row.heightPercentile <= heightPercentile) ?? ageRows[0];
  const upper = ageRows.find((row) => row.heightPercentile >= heightPercentile) ?? ageRows[ageRows.length - 1];
  const ratio = lower.heightPercentile === upper.heightPercentile
    ? 0
    : (heightPercentile - lower.heightPercentile) / (upper.heightPercentile - lower.heightPercentile);

  return {
    ...lower,
    heightPercentile,
    heightCm: interpolate(lower.heightCm, upper.heightCm, ratio),
    systolic90: interpolate(lower.systolic90, upper.systolic90, ratio),
    systolic95: interpolate(lower.systolic95, upper.systolic95, ratio),
    systolic95Plus12: interpolate(lower.systolic95Plus12, upper.systolic95Plus12, ratio),
    diastolic90: interpolate(lower.diastolic90, upper.diastolic90, ratio),
    diastolic95: interpolate(lower.diastolic95, upper.diastolic95, ratio),
    diastolic95Plus12: interpolate(lower.diastolic95Plus12, upper.diastolic95Plus12, ratio),
  };
}

function classifyBpValue(ageYearsDecimal: number, value: number, isSystolic: boolean, thresholds: BpReferenceRow): BpCategory {
  if (ageYearsDecimal >= 13) {
    if (isSystolic) {
      if (value >= 140) return 'Stage 2 hypertension';
      if (value >= 130) return 'Stage 1 hypertension';
      if (value >= 120) return 'Elevated BP';
      return 'Normal';
    }

    if (value >= 90) return 'Stage 2 hypertension';
    if (value >= 80) return 'Stage 1 hypertension';
    return 'Normal';
  }

  const p90 = Math.min(isSystolic ? thresholds.systolic90 : thresholds.diastolic90, isSystolic ? 120 : 80);
  const p95 = Math.min(isSystolic ? thresholds.systolic95 : thresholds.diastolic95, isSystolic ? 130 : 80);
  const stage2 = Math.min(isSystolic ? thresholds.systolic95Plus12 : thresholds.diastolic95Plus12, isSystolic ? 140 : 90);

  if (value >= stage2) return 'Stage 2 hypertension';
  if (value >= p95) return 'Stage 1 hypertension';
  if (value >= p90) return 'Elevated BP';
  return 'Normal';
}

function worseCategory(a: BpCategory, b: BpCategory): BpCategory {
  const order: BpCategory[] = ['Normal', 'Elevated BP', 'Stage 1 hypertension', 'Stage 2 hypertension'];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}

function percentileText(category: BpCategory): string {
  if (category === 'Normal') return 'below the 90th percentile or adolescent normal threshold';
  if (category === 'Elevated BP') return 'at/above the 90th percentile or adolescent elevated threshold';
  if (category === 'Stage 1 hypertension') return 'at/above the 95th percentile or adolescent stage 1 threshold';
  return 'at/above the stage 2 threshold';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function interpolate(lower: number, upper: number, ratio: number): number {
  return lower + (upper - lower) * ratio;
}
