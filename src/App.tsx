import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calculator,
  Clipboard,
  Heart,
  Home,
  Share2,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import { BmiChart } from './components/BmiChart';
import { BpChart } from './components/BpChart';
import { InputForm, type FormState } from './components/InputForm';
import { BMI_BOYS_SAMPLE_MODE } from './data/bmiBoys';
import { BMI_GIRLS_SAMPLE_MODE } from './data/bmiGirls';
import { BP_BOYS_SAMPLE_MODE } from './data/bpBoys';
import { BP_GIRLS_SAMPLE_MODE } from './data/bpGirls';
import { calculateAge } from './lib/age';
import { getBmiResult } from './lib/bmi';
import { getBpResult } from './lib/bp';

const initialForm: FormState = {
  ageYears: '8',
  ageMonths: '4',
  sex: 'male',
  heightCm: '128',
  weightKg: '28',
  systolic: '112',
  diastolic: '72',
};

const logoUrl = `${import.meta.env.BASE_URL}pedia-icon.svg`;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function App() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [copied, setCopied] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [screen, setScreen] = useState<'form' | 'results'>('form');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [installMessage, setInstallMessage] = useState('');

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const parsed = useMemo(() => {
    const errors: Record<string, string> = {};
    const ageYears = parseOptionalNumber(form.ageYears);
    const ageMonths = parseOptionalNumber(form.ageMonths);
    const age = calculateAge({
      measurementDate: '',
      years: ageYears,
      months: ageMonths,
    });

    const heightCm = parseRequiredNumber(form.heightCm, 'Height', errors, 'heightCm', 45, 220);
    const weightKg = parseRequiredNumber(form.weightKg, 'Weight', errors, 'weightKg', 2, 250);
    const systolic = parseRequiredNumber(form.systolic, 'Systolic BP', errors, 'systolic', 40, 260);
    const diastolic = parseRequiredNumber(form.diastolic, 'Diastolic BP', errors, 'diastolic', 20, 180);

    if (!age) errors.ageYears = 'Enter age.';
    if (age && (age.decimalYears < 2 || age.decimalYears > 19)) {
      errors.ageYears = 'BMI-for-age scope is 2-19 years.';
    }
    if ((ageMonths ?? 0) > 11) {
      errors.ageMonths = 'Use 0-11 months.';
    }

    const bmiResult = age && heightCm && weightKg
      ? getBmiResult(form.sex, age.totalMonths, heightCm, weightKg)
      : null;
    const bpResult = age && heightCm && systolic && diastolic
      ? getBpResult(form.sex, age.decimalYears, heightCm, systolic, diastolic)
      : null;

    return { errors, age, heightCm, weightKg, systolic, diastolic, bmiResult, bpResult };
  }, [form]);

  const summaryPoints = useMemo(() => {
    if (!parsed.age || !parsed.heightCm || !parsed.weightKg || !parsed.systolic || !parsed.diastolic || !parsed.bmiResult || !parsed.bpResult) {
      return ['Enter complete valid measurements to generate a clinical summary.'];
    }

    return [
      `Child: ${parsed.age.label}, ${form.sex}; height ${formatNumber(parsed.heightCm)} cm, weight ${formatNumber(parsed.weightKg)} kg.`,
      `BMI ${parsed.bmiResult.bmi.toFixed(1)} kg/m2, approximately ${parsed.bmiResult.percentile.toFixed(0)}th percentile: ${parsed.bmiResult.category}.`,
      `BP ${formatNumber(parsed.systolic)}/${formatNumber(parsed.diastolic)} mmHg: ${parsed.bpResult.category}.`,
    ];
  }, [form.sex, parsed]);

  const summary = summaryPoints.map((point) => `- ${point}`).join('\n');

  const bmiSampleMode = BMI_BOYS_SAMPLE_MODE || BMI_GIRLS_SAMPLE_MODE;
  const bpSampleMode = BP_BOYS_SAMPLE_MODE || BP_GIRLS_SAMPLE_MODE;

  async function copySummary() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function calculate() {
    setShowErrors(true);
    if (Object.keys(parsed.errors).length === 0 && parsed.bmiResult && parsed.bpResult) {
      setScreen('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function updateForm(next: FormState) {
    setForm(next);
    setCopied(false);
  }

  async function shareLove() {
    const shareUrl = window.location.href;
    const text = 'PediaCentile: a mobile pediatric BMI and BP screening support tool.';

    if (navigator.share) {
      try {
        await navigator.share({ title: 'PediaCentile', text, url: shareUrl });
        setShareMessage('Shared');
        window.setTimeout(() => setShareMessage(''), 1800);
      } catch {
        setShareMessage('');
      }
      return;
    }

    const twitterUrl = new URL('https://x.com/intent/tweet');
    twitterUrl.searchParams.set('text', text);
    twitterUrl.searchParams.set('url', shareUrl);
    twitterUrl.searchParams.set('via', 'ggnagarkar');
    window.open(twitterUrl.toString(), '_blank', 'noopener,noreferrer');
  }

  async function addToPhone() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      setInstallMessage(choice.outcome === 'accepted' ? 'Added to phone' : 'Install dismissed');
      window.setTimeout(() => setInstallMessage(''), 2200);
      return;
    }

    setInstallMessage('Use browser Share or menu, then Add to Home Screen.');
    window.setTimeout(() => setInstallMessage(''), 3600);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-clinical-sky">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
        <header className="flex items-center gap-3 rounded-lg bg-clinical-ink px-4 py-4 text-white shadow-card">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
            <img className="h-10 w-10" src={logoUrl} alt="" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight">PediaCentile</h1>
            <p className="text-sm text-slate-200">Pediatric BMI and BP screening support.</p>
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/12 text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-clinical-mint lg:hidden"
            onClick={addToPhone}
            aria-label="Add PediaCentile to phone home screen"
            title="Add to phone"
          >
            {installPrompt ? <Home size={21} aria-hidden="true" /> : <Smartphone size={21} aria-hidden="true" />}
          </button>
        </header>
        {installMessage ? (
          <p className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-card">{installMessage}</p>
        ) : null}

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <div className="flex gap-2">
            <ShieldAlert className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
            <p>
              For clinical screening support only. Confirm abnormal BP with repeat measurements and clinical judgment.
              {bmiSampleMode ? ' BMI sample data mode is active.' : ' BMI uses bundled WHO LMS reference tables.'}
              {bpSampleMode ? ' BP sample data mode is active: bundled BP thresholds remain illustrative until official BP data is added.' : ''}
            </p>
          </div>
        </div>

        {screen === 'form' ? (
          <>
            <InputForm value={form} errors={showErrors ? parsed.errors : {}} onChange={updateForm} />
            <button
              type="button"
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-clinical-teal px-5 text-base font-bold text-white shadow-card transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-clinical-mint"
              onClick={calculate}
            >
              <Calculator size={22} aria-hidden="true" />
              Calculate centiles
            </button>
          </>
        ) : (
          <>
            <section className="rounded-lg bg-white p-4 shadow-card ring-1 ring-slate-200 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-clinical-ink transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-clinical-mint"
                  onClick={() => setScreen('form')}
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  Edit inputs
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-clinical-teal px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-clinical-mint"
                  onClick={copySummary}
                >
                  <Clipboard size={18} aria-hidden="true" />
                  {copied ? 'Copied' : 'Copy summary'}
                </button>
              </div>

              <h2 className="text-lg font-semibold text-clinical-ink">Clinical summary</h2>
              <ul className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-clinical-ink ring-1 ring-slate-200">
                {summaryPoints.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clinical-teal" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ResultPill
                  label="BMI"
                  value={parsed.bmiResult ? `${parsed.bmiResult.bmi.toFixed(1)} kg/m2` : '-'}
                  detail={parsed.bmiResult ? `${parsed.bmiResult.percentile.toFixed(0)}th percentile - ${parsed.bmiResult.category}` : 'Not available'}
                />
                <ResultPill
                  label="Blood pressure"
                  value={parsed.systolic && parsed.diastolic ? `${formatNumber(parsed.systolic)}/${formatNumber(parsed.diastolic)} mmHg` : '-'}
                  detail={parsed.bpResult ? parsed.bpResult.category : 'Not available'}
                />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <BmiChart sex={form.sex} ageYears={parsed.age?.decimalYears ?? null} bmiResult={parsed.bmiResult} />
              <BpChart systolic={parsed.systolic} diastolic={parsed.diastolic} bpResult={parsed.bpResult} />
            </section>
          </>
        )}

        <footer className="rounded-lg bg-white p-4 shadow-card ring-1 ring-slate-200 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Heart size={21} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-clinical-ink">
                  With love from{' '}
                  <a
                    className="text-clinical-teal underline-offset-4 hover:underline"
                    href="https://x.com/ggnagarkar"
                    target="_blank"
                    rel="noreferrer"
                  >
                    GG Nagarkar
                  </a>
                </p>
                <p className="text-xs text-slate-600">Share it with pediatric colleagues who may find it useful.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-clinical-ink transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-clinical-mint"
                onClick={shareLove}
              >
                <Share2 size={18} aria-hidden="true" />
                {shareMessage || 'Share'}
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-clinical-ink px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-clinical-mint"
                onClick={addToPhone}
              >
                {installPrompt ? <Home size={18} aria-hidden="true" /> : <Smartphone size={18} aria-hidden="true" />}
                Add to phone
              </button>
            </div>
          </div>
          {installMessage ? (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">{installMessage}</p>
          ) : null}
        </footer>
      </div>
    </main>
  );
}

function ResultPill({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-clinical-ink">{value}</div>
      <div className="mt-1 text-sm text-slate-700">{detail}</div>
    </div>
  );
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseRequiredNumber(
  value: string,
  label: string,
  errors: Record<string, string>,
  key: string,
  min: number,
  max: number,
): number | null {
  const parsed = Number(value);
  if (!value.trim() || !Number.isFinite(parsed)) {
    errors[key] = `${label} is required.`;
    return null;
  }
  if (parsed < min || parsed > max) {
    errors[key] = `${label} should be between ${min} and ${max}.`;
    return null;
  }
  return parsed;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}
