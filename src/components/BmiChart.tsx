import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { buildBmiCurve, type BmiResult, type Sex } from '../lib/bmi';

type BmiChartProps = {
  sex: Sex;
  ageYears: number | null;
  bmiResult: BmiResult | null;
};

export function BmiChart({ sex, ageYears, bmiResult }: BmiChartProps) {
  const curve = buildBmiCurve(sex);
  const childPoint = ageYears && bmiResult ? [{ ageYears, bmi: bmiResult.bmi }] : [];

  return (
    <section className="rounded-lg bg-white p-4 shadow-card ring-1 ring-slate-200 sm:p-5">
      <h2 className="text-lg font-semibold text-clinical-ink">BMI-for-age graph</h2>
      <div className="mt-3 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={curve} margin={{ top: 10, right: 10, bottom: 8, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe5ea" />
            <XAxis dataKey="ageYears" type="number" domain={[2, 19]} tickCount={7} unit="y" />
            <YAxis domain={['dataMin - 1', 'dataMax + 2']} width={42} />
            <Legend verticalAlign="top" height={28} />
            <Line type="monotone" dataKey="sdMinus2" name="-2 SD" stroke="#6b9ac4" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="median" name="Median" stroke="#087f8c" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="sdPlus1" name="+1 SD" stroke="#f2b84b" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="sdPlus2" name="+2 SD" stroke="#e06d5f" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="sdPlus3" name="+3 SD" stroke="#9f1239" dot={false} strokeWidth={2} />
            <Scatter data={childPoint} dataKey="bmi" name="Child" fill="#17324d" />
            <ZAxis range={[120, 120]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
