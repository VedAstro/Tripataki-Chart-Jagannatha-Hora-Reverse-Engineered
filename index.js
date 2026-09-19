// JHora Tripataki D-1 lattice reconstructed from the native desktop workflow.
// Requires Node.js 18+ (fetch is built in).

import { writeFile } from "node:fs/promises";

const API_BASE_URL = "https://api.vedastro.org/api";
const AYANAMSA = "LAHIRI";
const TARGET_YEAR = 2026;

// Change these values to calculate another chart.
const birthDetails = {
  StdTime: "12:44 23/04/1994 +08:00",
  Location: {
    Name: "Ipoh, Malaysia",
    Longitude: 101.0833,
    Latitude: 4.5833,
  },
};

const useGet = process.argv.includes("--get");
const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
const SIGN_LABELS = ["Ar", "Ta", "Ge", "Cn", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"];
const PLANET_LABELS = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
};
const ANCHORS = [
  { x: 400, y: 105, labelX: 400, labelY: 68, bodyX: 400, bodyY: 103 },
  { x: 240, y: 105, labelX: 240, labelY: 68, bodyX: 240, bodyY: 103 },
  { x: 85, y: 260, labelX: 54, labelY: 267, bodyX: 54, bodyY: 310 },
  { x: 85, y: 400, labelX: 54, labelY: 407, bodyX: 54, bodyY: 450 },
  { x: 85, y: 540, labelX: 54, labelY: 547, bodyX: 54, bodyY: 590 },
  { x: 240, y: 680, labelX: 240, labelY: 706, bodyX: 240, bodyY: 745 },
  { x: 400, y: 680, labelX: 400, labelY: 706, bodyX: 400, bodyY: 745 },
  { x: 560, y: 680, labelX: 560, labelY: 706, bodyX: 560, bodyY: 745 },
  { x: 715, y: 540, labelX: 746, labelY: 547, bodyX: 746, bodyY: 590 },
  { x: 715, y: 400, labelX: 746, labelY: 407, bodyX: 746, bodyY: 450 },
  { x: 715, y: 260, labelX: 746, labelY: 267, bodyX: 746, bodyY: 310 },
  { x: 560, y: 105, labelX: 560, labelY: 68, bodyX: 560, bodyY: 103 },
];

function buildGetUrl(calculatorName, time, extraParameters = {}) {
  const [clock, date, offset] = time.StdTime.split(/\s+/);
  const [day, month, year] = date.split("/");
  const location = time.Location.Name.replace(/\s+/g, "");
  const parts = [
    "Calculate", calculatorName, "Location", location, "Time",
    clock, day, month, year, offset,
  ];
  for (const [name, value] of Object.entries(extraParameters)) parts.push(name, String(value));
  parts.push("Ayanamsa", AYANAMSA);
  return `${API_BASE_URL}/${parts.map(encodeURIComponent).join("/")}`;
}

async function calculate(calculatorName, time, extraParameters = {}) {
  const url = useGet
    ? buildGetUrl(calculatorName, time, extraParameters)
    : `${API_BASE_URL}/Calculate/${calculatorName}`;
  const requestBody = calculatorName === "TajikaDateForYear2"
    ? { Ayanamsa: AYANAMSA, birthTime: time, scanYear: extraParameters.ScanYear }
    : { Ayanamsa: AYANAMSA, Time: time };
  const response = await fetch(url, useGet ? undefined : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) throw new Error(`${calculatorName} failed: HTTP ${response.status}`);
  const envelope = await response.json();
  if (envelope.Status !== "Pass") {
    throw new Error(`${calculatorName} failed: ${JSON.stringify(envelope.Payload)}`);
  }
  return envelope.Payload[calculatorName];
}

function signIndex(value) {
  const signName = String(value).split(":", 1)[0].trim();
  const index = SIGN_NAMES.indexOf(signName);
  if (index < 0) throw new Error(`Unknown zodiac sign in API value: ${value}`);
  return index;
}

function buildTripataki(planetRows, annualHouseRows, solarReturn, targetYear) {
  const planets = Object.fromEntries(
    planetRows.map((row) => [row.Planet, row.AllPlanetRasiSigns]),
  );
  const annualHouses = Object.fromEntries(
    annualHouseRows.map((row) => [row.House, row.AllHouseRasiSigns]),
  );
  const referenceIndex = signIndex(annualHouses.House1);
  const birthYear = Number(birthDetails.StdTime.split(/\s+/)[1].split("/")[2]);
  const completedYears = targetYear - birthYear;
  if (completedYears < 0) throw new Error("TARGET_YEAR cannot be before the birth year");
  const currentYear = completedYears + 1;
  const cycleCount = (cycle) => currentYear % cycle || cycle;
  const progression = {
    Moon: { cycle: 9, count: cycleCount(9), direction: 1 },
    Sun: { cycle: 4, count: cycleCount(4), direction: 1 },
    Mercury: { cycle: 4, count: cycleCount(4), direction: 1 },
    Jupiter: { cycle: 4, count: cycleCount(4), direction: 1 },
    Venus: { cycle: 4, count: cycleCount(4), direction: 1 },
    Saturn: { cycle: 4, count: cycleCount(4), direction: 1 },
    Mars: { cycle: 6, count: cycleCount(6), direction: 1 },
    Rahu: { cycle: 6, count: cycleCount(6), direction: -1 },
    Ketu: { cycle: 6, count: cycleCount(6), direction: -1 },
  };
  const sectors = ANCHORS.map((anchor, relative) => {
    const index = (referenceIndex + relative) % 12;
    return {
      sector: relative + 1,
      relative,
      sign: SIGN_NAMES[index],
      label: SIGN_LABELS[index],
      ...anchor,
    };
  });
  const placements = [
    {
      name: "Varsha Lagna",
      label: "As",
      natalSign: null,
      progressedSign: SIGN_NAMES[referenceIndex],
      rule: "Annual ascendant at the sidereal solar return",
    },
    ...["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]
      .map((name) => {
        const natalIndex = signIndex(planets[name]);
        const rule = progression[name];
        const progressedIndex = (natalIndex + rule.direction * (rule.count - 1) + 120) % 12;
        return {
          name,
          label: PLANET_LABELS[name],
          natalSign: SIGN_NAMES[natalIndex],
          progressedSign: SIGN_NAMES[progressedIndex],
          cycle: rule.cycle,
          count: rule.count,
          direction: rule.direction === -1 ? "reverse" : "forward",
          rule: `${rule.count}${[1, 21, 31].includes(rule.count) ? "st" : rule.count === 2 ? "nd" : rule.count === 3 ? "rd" : "th"} sign from natal ${SIGN_NAMES[natalIndex]}`,
        };
      }),
  ].map((body) => {
    const index = SIGN_NAMES.indexOf(body.progressedSign);
    const relative = (index - referenceIndex + 12) % 12;
    return { ...sectors[relative], ...body, sign: SIGN_NAMES[index] };
  });
  return {
    chart: `Annual Tripataki — ${targetYear}–${targetYear + 1}`,
    targetYear,
    completedYears,
    currentYear,
    solarReturn,
    referenceSign: SIGN_NAMES[referenceIndex],
    sectors,
    placements,
  };
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]);
}

function renderSvg(model) {
  const lines = [
    [240, 105, 240, 680], [400, 105, 400, 680], [560, 105, 560, 680],
    [85, 260, 715, 260], [85, 400, 715, 400], [85, 540, 715, 540],
    [85, 260, 240, 105], [240, 105, 400, 260], [400, 260, 560, 105], [560, 105, 715, 260],
    [85, 400, 240, 260], [240, 260, 400, 400], [400, 400, 560, 260], [560, 260, 715, 400],
    [85, 540, 240, 400], [240, 400, 400, 540], [400, 540, 560, 400], [560, 400, 715, 540],
    [85, 540, 240, 680], [240, 680, 400, 540], [400, 540, 560, 680], [560, 680, 715, 540],
  ].map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join("");
  const flags = [240, 400, 560]
    .map((x) => `<path d="M${x} 105 L${x - 30} 90 L${x} 75 Z"/>`).join("");
  const signs = model.sectors
    .map((sector) => `<text class="sign" x="${sector.labelX}" y="${sector.labelY}">${sector.label}</text>`).join("");
  const counts = new Map();
  const bodies = model.placements.map((body) => {
    const collision = counts.get(body.relative) ?? 0;
    counts.set(body.relative, collision + 1);
    return `<text class="body" x="${body.bodyX}" y="${body.bodyY + collision * 27}">${escapeXml(body.label)}</text>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 800" role="img" aria-labelledby="title description">
  <title id="title">JHora Tripataki D-1 chart</title>
  <desc id="description">Twelve-sign annual Tripataki lattice arranged from the Varsha Lagna with age-progressed natal planets.</desc>
  <rect width="900" height="800" fill="#f4f4f4"/>
  <style>.heading{font:22px Arial;fill:#c22}.sign{font:20px Arial;fill:#445;dominant-baseline:middle;text-anchor:middle}.body{font:34px Arial;fill:#c22;dominant-baseline:middle;text-anchor:middle}.lattice{fill:none;stroke:#222;stroke-width:2.5}</style>
  <text class="heading" x="20" y="35">Annual Tripataki ${model.targetYear}–${model.targetYear + 1} · Running year ${model.currentYear}</text>
  <g class="lattice">${lines}${flags}</g>
  ${signs}${bodies}
</svg>`;
}

async function main() {
  const [planetRows, solarReturn] = await Promise.all([
    calculate("AllPlanetRasiSigns", birthDetails),
    calculate("TajikaDateForYear2", birthDetails, { ScanYear: TARGET_YEAR }),
  ]);
  const annualHouseRows = await calculate("AllHouseRasiSigns", solarReturn);
  const model = buildTripataki(planetRows, annualHouseRows, solarReturn, TARGET_YEAR);
  await writeFile("tripataki-chart.svg", renderSvg(model), "utf8");
  console.log(JSON.stringify({
    ...model,
    requestMethod: useGet ? "GET" : "POST",
    ayanamsa: AYANAMSA,
    birthDetails,
    generatedFile: "tripataki-chart.svg",
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
