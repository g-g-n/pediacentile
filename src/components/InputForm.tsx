import { CalendarDays, Check, User, UserRound, UserRoundCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Sex } from '../lib/bmi';

export type FormState = {
  reference: string;
  dateOfBirth: string;
  ageYears: string;
  ageMonths: string;
  sex: Sex;
  heightCm: string;
  weightKg: string;
  systolic: string;
  diastolic: string;
  measurementDate: string;
};

type InputFormProps = {
  value: FormState;
  errors: Record<string, string>;
  onChange: (next: FormState) => void;
};

export function InputForm({ value, errors, onChange }: InputFormProps) {
  const setField = <K extends keyof FormState>(field: K, fieldValue: FormState[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <section className="rounded-lg bg-white p-4 shadow-card ring-1 ring-slate-200 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-clinical-sky text-clinical-teal">
          <UserRound size={22} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-clinical-ink">Patient input</h2>
          <p className="text-sm text-slate-600">Age 2-19 years for BMI-for-age.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name / reference ID" error={errors.reference}>
          <input
            className={inputClass}
            value={value.reference}
            onChange={(event) => setField('reference', event.target.value)}
            placeholder="Optional"
          />
        </Field>

        <Field label="Measurement date" error={errors.measurementDate}>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-3 text-slate-400" size={20} aria-hidden="true" />
            <input
              className={`${inputClass} pl-10`}
              type="date"
              value={value.measurementDate}
              onChange={(event) => setField('measurementDate', event.target.value)}
            />
          </div>
        </Field>

        <Field label="Date of birth" error={errors.dateOfBirth}>
          <input
            className={inputClass}
            type="date"
            value={value.dateOfBirth}
            onChange={(event) => setField('dateOfBirth', event.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Age years" error={errors.ageYears}>
            <input
              className={inputClass}
              inputMode="numeric"
              value={value.ageYears}
              disabled={Boolean(value.dateOfBirth)}
              onChange={(event) => setField('ageYears', event.target.value)}
              placeholder="8"
            />
          </Field>
          <Field label="Months" error={errors.ageMonths}>
            <input
              className={inputClass}
              inputMode="numeric"
              value={value.ageMonths}
              disabled={Boolean(value.dateOfBirth)}
              onChange={(event) => setField('ageMonths', event.target.value)}
              placeholder="4"
            />
          </Field>
        </div>

        <Field label="Sex" error={errors.sex}>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-300 bg-slate-100 p-1.5">
            {(['male', 'female'] as const).map((sex) => (
              <button
                key={sex}
                type="button"
                aria-pressed={value.sex === sex}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-md border px-3 text-sm font-bold capitalize transition focus:outline-none focus:ring-4 focus:ring-clinical-mint ${
                  value.sex === sex
                    ? 'border-clinical-teal bg-clinical-teal text-white shadow-card'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => setField('sex', sex)}
              >
                {value.sex === sex ? <UserRoundCheck size={18} aria-hidden="true" /> : <User size={18} aria-hidden="true" />}
                {sex}
                {value.sex === sex ? <Check size={17} aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Height (cm)" error={errors.heightCm}>
            <input
              className={inputClass}
              inputMode="decimal"
              value={value.heightCm}
              onChange={(event) => setField('heightCm', event.target.value)}
              placeholder="128"
            />
          </Field>
          <Field label="Weight (kg)" error={errors.weightKg}>
            <input
              className={inputClass}
              inputMode="decimal"
              value={value.weightKg}
              onChange={(event) => setField('weightKg', event.target.value)}
              placeholder="28"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
          <Field label="Systolic BP" error={errors.systolic}>
            <input
              className={inputClass}
              inputMode="numeric"
              value={value.systolic}
              onChange={(event) => setField('systolic', event.target.value)}
              placeholder="112"
            />
          </Field>
          <Field label="Diastolic BP" error={errors.diastolic}>
            <input
              className={inputClass}
              inputMode="numeric"
              value={value.diastolic}
              onChange={(event) => setField('diastolic', event.target.value)}
              placeholder="72"
            />
          </Field>
        </div>
      </div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

const inputClass = 'min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-clinical-ink outline-none transition placeholder:text-slate-400 focus:border-clinical-teal focus:ring-4 focus:ring-clinical-mint disabled:bg-slate-100 disabled:text-slate-400';
