import { Activity, HeartPulse } from 'lucide-react';
import type { ReactNode } from 'react';
import type { BmiResult } from '../lib/bmi';
import type { BpResult } from '../lib/bp';

type ResultCardsProps = {
  bmiResult: BmiResult | null;
  bpResult: BpResult | null;
};

export function ResultCards({ bmiResult, bpResult }: ResultCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ResultCard
        title="BMI result"
        icon={<Activity size={22} aria-hidden="true" />}
        accent="bg-clinical-mint text-clinical-teal"
      >
        {bmiResult ? (
          <>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-clinical-ink">{bmiResult.bmi.toFixed(1)}</span>
              <span className="pb-1 text-sm font-medium text-slate-600">kg/m2</span>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              Approximately {bmiResult.percentile.toFixed(0)}th percentile, z-score {bmiResult.zScore.toFixed(2)}.
            </p>
            <Badge tone={bmiResult.zScore > 1 || bmiResult.zScore < -2 ? 'warn' : 'ok'}>{bmiResult.category}</Badge>
          </>
        ) : (
          <EmptyResult text="Enter valid age, height, and weight." />
        )}
      </ResultCard>

      <ResultCard
        title="BP result"
        icon={<HeartPulse size={22} aria-hidden="true" />}
        accent="bg-red-50 text-red-700"
      >
        {bpResult ? (
          <>
            <div className="text-3xl font-bold text-clinical-ink">{bpResult.category}</div>
            <p className="mt-3 text-sm text-slate-700">
              Classification uses systolic or diastolic, whichever is worse. Height percentile estimate: {bpResult.heightPercentile.toFixed(0)}th.
            </p>
            <Badge tone={bpResult.category === 'Normal' ? 'ok' : 'warn'}>{bpResult.approximatePercentileText}</Badge>
          </>
        ) : (
          <EmptyResult text="Enter valid age, height, and blood pressure." />
        )}
      </ResultCard>
    </div>
  );
}

function ResultCard({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: ReactNode;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-card ring-1 ring-slate-200 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>{icon}</div>
        <h2 className="text-lg font-semibold text-clinical-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: 'ok' | 'warn' }) {
  return (
    <div className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${
      tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
    }`}>
      {children}
    </div>
  );
}

function EmptyResult({ text }: { text: string }) {
  return <p className="text-sm text-slate-600">{text}</p>;
}
