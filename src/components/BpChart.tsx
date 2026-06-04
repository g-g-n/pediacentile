import type { BpCategory, BpResult } from '../lib/bp';

type BpChartProps = {
  systolic: number | null;
  diastolic: number | null;
  bpResult: BpResult | null;
};

type Band = {
  label: BpCategory;
  from: number;
  to: number;
  className: string;
};

export function BpChart({ systolic, diastolic, bpResult }: BpChartProps) {
  const thresholds = bpResult?.thresholds;

  return (
    <section className="rounded-lg bg-white p-4 shadow-card ring-1 ring-slate-200 sm:p-5">
      <h2 className="text-lg font-semibold text-clinical-ink">BP category bands</h2>
      <p className="mt-1 text-sm text-slate-600">
        Read systolic and diastolic separately. The final category is whichever side is worse.
      </p>

      {thresholds ? (
        <div className="mt-4 grid gap-4">
          <PressureBand
            title="Systolic"
            value={systolic}
            category={bpResult.systolicCategory}
            elevated={thresholds.systolic90}
            stage1={thresholds.systolic95}
            stage2={thresholds.systolic95Plus12}
          />
          <PressureBand
            title="Diastolic"
            value={diastolic}
            category={bpResult.diastolicCategory}
            elevated={thresholds.diastolic90}
            stage1={thresholds.diastolic95}
            stage2={thresholds.diastolic95Plus12}
          />
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          Enter valid measurements to show BP category bands.
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
        <Zone color="bg-emerald-100" label="Normal" />
        <Zone color="bg-amber-100" label="Elevated" />
        <Zone color="bg-orange-100" label="Stage 1" />
        <Zone color="bg-red-100" label="Stage 2" />
      </div>
    </section>
  );
}

function PressureBand({
  title,
  value,
  category,
  elevated,
  stage1,
  stage2,
}: {
  title: string;
  value: number | null;
  category: BpCategory;
  elevated: number;
  stage1: number;
  stage2: number;
}) {
  const min = Math.max(0, Math.floor(Math.min(value ?? elevated, elevated) - 16));
  const max = Math.ceil(Math.max(value ?? stage2, stage2) + 16);
  const bands: Band[] = [
    { label: 'Normal', from: min, to: elevated, className: 'bg-emerald-100' },
    { label: 'Elevated BP', from: elevated, to: stage1, className: 'bg-amber-100' },
    { label: 'Stage 1 hypertension', from: stage1, to: stage2, className: 'bg-orange-100' },
    { label: 'Stage 2 hypertension', from: stage2, to: max, className: 'bg-red-100' },
  ];
  const markerLeft = value === null ? 0 : clamp(((value - min) / (max - min)) * 100, 0, 100);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-clinical-ink">{title}</h3>
        <div className="text-right">
          <div className="text-xl font-bold text-clinical-ink">{value ? `${value} mmHg` : 'No value'}</div>
          <div className={`text-sm font-semibold ${category === 'Normal' ? 'text-emerald-800' : 'text-amber-900'}`}>
            {category}
          </div>
        </div>
      </div>

      <div className="relative mt-5 pb-7">
        <div className="flex h-14 overflow-hidden rounded-lg ring-1 ring-slate-200">
          {bands.map((band) => (
            <div
              key={band.label}
              className={`flex min-w-0 items-center justify-center px-1 text-center text-[11px] font-semibold leading-tight text-slate-700 ${band.className}`}
              style={{ width: `${((band.to - band.from) / (max - min)) * 100}%` }}
            >
              {shortBandLabel(band.label)}
            </div>
          ))}
        </div>

        {value !== null ? (
          <div
            className="absolute top-[-10px] flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${markerLeft}%` }}
          >
            <div className="rounded-md bg-clinical-ink px-2 py-1 text-xs font-bold text-white shadow-sm">
              {value}
            </div>
            <div className="h-[64px] w-1 rounded-full bg-clinical-ink" />
          </div>
        ) : null}

        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[11px] text-slate-500">
          <span>{min}</span>
          <span>{Math.round(elevated)}</span>
          <span>{Math.round(stage1)}</span>
          <span>{Math.round(stage2)}</span>
          <span>{max}</span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-600">
        <Threshold label="Elevated" value={elevated} />
        <Threshold label="Stage 1" value={stage1} />
        <Threshold label="Stage 2" value={stage2} />
      </div>
    </div>
  );
}

function Threshold({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white px-2 py-2 text-center ring-1 ring-slate-200">
      <div className="font-semibold text-slate-700">{label}</div>
      <div>{Math.round(value)} mmHg</div>
    </div>
  );
}

function Zone({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-2">
      <span className={`h-3 w-3 rounded-sm ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function shortBandLabel(label: BpCategory): string {
  if (label === 'Elevated BP') return 'Elevated';
  if (label === 'Stage 1 hypertension') return 'Stage 1';
  if (label === 'Stage 2 hypertension') return 'Stage 2';
  return 'Normal';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
