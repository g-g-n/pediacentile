import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const sources = {
  boys2to5: 'tmp/source-data/who_bmi_boys_2_5_z.xlsx',
  boys5to19: 'tmp/source-data/who_bmi_boys_5_19_z.xlsx',
  girls2to5: 'tmp/source-data/who_bmi_girls_2_5_z.xlsx',
  girls5to19: 'tmp/source-data/who_bmi_girls_5_19_z.xlsx',
};

function zipEntry(file, entry) {
  return execFileSync('unzip', ['-p', file, entry], { encoding: 'utf8' });
}

function parseSharedStrings(xml) {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) => {
    const text = [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => part[1]).join('');
    return decodeXml(text);
  });
}

function decodeXml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function columnIndex(cellRef) {
  const letters = cellRef.match(/[A-Z]+/)?.[0] ?? 'A';
  return [...letters].reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function parseSheet(file) {
  const sharedStrings = parseSharedStrings(zipEntry(file, 'xl/sharedStrings.xml'));
  const sheet = zipEntry(file, 'xl/worksheets/sheet1.xml');
  const rows = [];

  for (const rowMatch of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\s+r="([^"]+)"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const [, ref, attrs, body] = cellMatch;
      const valueMatch = body.match(/<v>([\s\S]*?)<\/v>/);
      if (!valueMatch) continue;
      const raw = decodeXml(valueMatch[1]);
      row[columnIndex(ref)] = attrs.includes('t="s"') ? sharedStrings[Number(raw)] : Number(raw);
    }
    rows.push(row);
  }

  return rows.slice(1).map((row) => ({
    ageMonths: Number(row[0]),
    l: round(Number(row[1])),
    m: round(Number(row[2])),
    s: round(Number(row[3])),
  }));
}

function round(value) {
  return Number(value.toPrecision(12));
}

function combine(earlyFile, laterFile) {
  return [...parseSheet(earlyFile), ...parseSheet(laterFile)].sort((a, b) => a.ageMonths - b.ageMonths);
}

function renderData(exportName, flagName, rows, sourceLabel) {
  const body = rows
    .map((row) => `  { ageMonths: ${row.ageMonths}, l: ${row.l}, m: ${row.m}, s: ${row.s} },`)
    .join('\n');

  return `import type { BmiLmsPoint } from '../lib/bmi';

export const ${flagName} = false;

// WHO BMI-for-age LMS data generated from official WHO z-score Excel tables.
// Sources: ${sourceLabel}
// Coverage: 24-60 months from WHO Child Growth Standards; 61-228 months from WHO 2007 Reference.
export const ${exportName}: BmiLmsPoint[] = [
${body}
];
`;
}

writeFileSync(
  'src/data/bmiBoys.ts',
  renderData(
    'bmiBoys',
    'BMI_BOYS_SAMPLE_MODE',
    combine(sources.boys2to5, sources.boys5to19),
    'WHO BMI boys 2-5 z-scores and WHO BMI boys 5-19 z-scores',
  ),
);

writeFileSync(
  'src/data/bmiGirls.ts',
  renderData(
    'bmiGirls',
    'BMI_GIRLS_SAMPLE_MODE',
    combine(sources.girls2to5, sources.girls5to19),
    'WHO BMI girls 2-5 z-scores and WHO BMI girls 5-19 z-scores',
  ),
);
