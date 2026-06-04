# PediaCentile

PediaCentile is a mobile-first static React app for pediatric OPD screening support. It calculates age, BMI, approximate BMI-for-age percentile/z-score, and pediatric BP category, then renders mobile-readable graphs and a copyable clinical summary.

> For clinical screening support only. Confirm abnormal BP with repeat measurements and clinical judgment.

## Clinical Data Status

BMI-for-age now uses bundled WHO LMS reference data generated from official WHO z-score Excel tables:

- `src/data/bmiBoys.ts`: WHO BMI-for-age LMS data, boys, 24-228 months
- `src/data/bmiGirls.ts`: WHO BMI-for-age LMS data, girls, 24-228 months

The included BMI tables combine WHO Child Growth Standards for 24-60 months and the WHO 2007 growth reference for 61-228 months.

BP uses bundled 2017 AAP Clinical Practice Guideline table values:

- `src/data/bpBoys.ts`: AAP Table 4 BP levels for boys, ages 1-12 years by height percentile
- `src/data/bpGirls.ts`: AAP Table 5 BP levels for girls, ages 1-12 years by height percentile

For adolescents aged 13 years and older, the app uses the fixed AAP adolescent thresholds from Table 3.

The generator used for the WHO BMI tables is `scripts/generate-who-bmi-data.mjs`. The generator used for AAP BP tables is `scripts/generate-aap-bp-data.mjs`.

## Tech

- React + Vite
- TypeScript
- Tailwind CSS
- Recharts
- Static client-side app only
- No backend, database, login, or API calls

## Setup

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
```

For GitHub Pages builds, use:

```bash
GITHUB_PAGES=true npm run build
```

The Vite config sets the base path to `/pediacentile/` when `GITHUB_PAGES=true`.

## Deploy to GitHub Pages

This repo includes `.github/workflows/deploy.yml`.

1. Push to the `main` branch.
2. In GitHub repository settings, enable Pages with GitHub Actions as the source.
3. The workflow builds `dist/` and deploys it to GitHub Pages.

## Clinical Behavior

- BMI is calculated as `weightKg / heightM^2`.
- BMI z-score and percentile use the WHO LMS method.
- BMI graph displays WHO z-score curves: -2 SD, median, +1 SD, +2 SD, and +3 SD.
- BMI category follows WHO z-score cutoffs:
  - 24-60 months: severe thinness below -3 SD, thinness below -2 SD, overweight above +2 SD, obesity above +3 SD.
  - 61-228 months: severe thinness below -3 SD, thinness below -2 SD, overweight above +1 SD, obesity above +2 SD.
- BP classification follows the 2017 AAP approach:
  - For children under 13 years, category is based on AAP age/sex/height percentile thresholds.
  - Height percentile is interpolated from the AAP table heights for the nearest year of age.
  - For adolescents 13 years and older, fixed adolescent thresholds are used.
  - Systolic or diastolic category, whichever is worse, determines the final BP category.

## Disclaimer

PediaCentile is for clinical screening support only. It is not a diagnosis tool, it does not replace clinician judgment, and abnormal BP should be confirmed with repeat measurements using appropriate technique.

## Data Sources

- WHO Child Growth Standards BMI-for-age tables: https://www.who.int/toolkits/child-growth-standards/standards/body-mass-index-for-age-bmi-for-age
- WHO growth reference data for 5-19 years, BMI-for-age: https://www.who.int/toolkits/growth-reference-data-for-5to19-years/indicators/bmi-for-age
- AAP Clinical Practice Guideline for Screening and Management of High Blood Pressure in Children and Adolescents: https://publications.aap.org/pediatrics/article/140/3/e20171904/38358/Clinical-Practice-Guideline-for-Screening-and
- Indian Academy of Pediatrics Standard Treatment Guidelines, Hypertension: https://iapindia.org/standard-treatment-guidelines/
