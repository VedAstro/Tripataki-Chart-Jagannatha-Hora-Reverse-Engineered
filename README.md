<p align="center">
  <img src="./assets/jhora-reverse-engineered-header.webp" alt="JHora Reverse Engineered — from Jagannatha Hora to an open-source project" width="100%">
</p>

<p align="center">
  <a href="https://vedastro.org/Jagannatha-Hora-Software.html" target="_blank" rel="noopener noreferrer">
    <img src="./assets/run-jhora-online.svg" alt="🚀 Run FREE JHora Online Now" width="620">
  </a>
</p>

<p align="center">
  <strong><a href="https://vedastro.org/blog/JHora-Reverse-Engineered-Part-2-Tripataki-Chart.html">📖 Read the story: How My Tripataki Chart Changes with Every Year</a></strong>
</p>

# Tripataki Chart — Jagannatha Hora Reverse Engineered

Generate a true annual Tripataki Chakra from birth data and a target year. This dependency-free JavaScript example finds the sidereal solar return, calculates the Varsha Lagna, progresses the natal planets with the traditional 9/4/6-year rules, places them on JHora's recovered twelve-sign lattice, and writes the result as an SVG.

![Tripataki chart in the original Jagannatha Hora application](./assets/tripataki-chart-jhora.webp)

## Why this implementation goes beyond the screenshot

The recovered JHora screen above is labelled **“Planets in D-1 (from Lagna in D-1)”**. It gave us the genuine native display foundation, but traditional Tripataki is a year-specific Varshaphala technique:

- the centre flag begins with the **Varsha Lagna**, the Ascendant at the annual solar return;
- each planet begins from its **natal sign** and is progressed according to the running year of life;
- the resulting annual placements are inspected for **vedha**, especially influences reaching the Moon and Varsha Lagna.

This repository combines both layers honestly. The lattice, anchors and collision behavior come from the decompiled JHora feature. The annual progression layer follows the three-tier method described in K. S. Charak's *A Textbook of Varshaphala* and other traditional Varshaphala references.

## What was recovered from JHora?

- The registered MFC view class is `CTripatakiChakraView`.
- Native renderer `FUN_00481670` contains the lattice drawing and label-collision machinery.
- Recovered routine `FUN_00491150` exposes the twelve-sector coordinates and five native object-group branches.
- JHora's wider Tajaka system contains annual, monthly and finer return-chart modes, with the annual system anchored to the solar return.
- The native object groups include planets, Trisphuta, upagrahas, special lagnas and 36 Sahama slots.

This is one feature from VedAstro's full-binary recovery of the 32-bit x86 JHora executable: **7,535 functions inventoried, 7,533 recovered as C-like decompilation, and the remaining two preserved as complete assembly**.

## Traditional annual calculation

For a Tripataki covering target year `Y`:

1. Find the exact sidereal solar return in year `Y` and calculate its Ascendant. This is the **Varsha Lagna**.
2. Compute `completedYears = Y - birthYear` and `currentYear = completedYears + 1`.
3. Progress each natal sign by counting the indicated sign inclusively:

| Bodies | Divisor | Zero remainder | Direction |
|---|---:|---:|---|
| Moon | 9 | 9 | Forward |
| Sun, Mercury, Jupiter, Venus, Saturn | 4 | 4 | Forward |
| Mars | 6 | 6 | Forward |
| Rahu and Ketu | 6 | 6 | Reverse |

If the remainder is `1`, the planet stays in its natal sign. A remainder of `3` places a direct-moving planet in the third sign counted from its natal sign; Rahu and Ketu are counted backward.

Some authorities place Mars in the 4-year group or use annual-chart positions without progression. This example deliberately exposes the adopted three-tier rule instead of hiding the variation.

## Run the JavaScript example

You need [Node.js 18 or newer](https://nodejs.org/). There are no packages to install and no API key is required.

```bash
git clone https://github.com/VedAstro/Tripataki-Chart-Jagannatha-Hora-Reverse-Engineered.git
cd Tripataki-Chart-Jagannatha-Hora-Reverse-Engineered
npm start
```

The command prints the full annual model as JSON and creates `tripataki-chart.svg`. Edit `birthDetails` and `TARGET_YEAR` near the top of [`index.js`](./index.js) to calculate another person or year.

For the included birth data and target year 2026, the example calculates:

```text
Sidereal solar return: 17:42, 23 April 2026, +08:00
Completed years: 32
Running year: 33
Varsha Lagna: Virgo

Moon: natal Virgo → annual Tripataki Aquarius (33 mod 9 = 6)
Mars: natal Pisces → annual Tripataki Taurus (33 mod 6 = 3)
Rahu: natal Scorpio → annual Tripataki Virgo (reverse count of 3)
Ketu: natal Taurus → annual Tripataki Pisces (reverse count of 3)
```

## The three HTTPS calculations

The example uses public VedAstro endpoints:

```text
TajikaDateForYear2   → exact sidereal solar-return time
AllHouseRasiSigns    → Varsha Lagna at that return moment
AllPlanetRasiSigns   → natal signs to be progressed
```

POST requests are the default. To use readable GET routes instead:

```bash
npm run start:get
```

The birth-data body is ordinary JSON:

```json
{
  "Ayanamsa": "LAHIRI",
  "birthTime": {
    "StdTime": "12:44 23/04/1994 +08:00",
    "Location": {
      "Name": "Ipoh, Malaysia",
      "Longitude": 101.0833,
      "Latitude": 4.5833
    }
  },
  "scanYear": 2026
}
```

The other calls use the same `Time` structure—first with the natal time, then with the returned solar-return time.

## Reading the chart

The twelve signs are arranged counter-clockwise from the Varsha Lagna at the centre flag. At every outer point, three lattice lines converge. A planet at the other end of any of those lines is said to give vedha to the planet being judged. Co-location at the same point may also be treated as vedha.

Traditional practice pays particular attention to the Moon and Varsha Lagna:

- benefic vedha suggests support or constructive developments;
- malefic vedha suggests pressure, obstacles or tension;
- a mixture indicates mixed results;
- lordship, strength, the year lord, annual Tajaka yogas and natal promise modify every result.

Tripataki gives a broad annual overview. It should not be used alone for extreme predictions about disease, accidents or death.

## Files

- [`index.js`](./index.js) — solar-return call, annual progression rules, recovered placement logic and SVG renderer.
- [`assets/tripataki-chart-jhora.webp`](./assets/tripataki-chart-jhora.webp) — optimized reference screenshot of the recovered D-1 view.
- [`LICENSE`](./LICENSE) — MIT License.

## Try the interface

Open [JHora Online](https://vedastro.org/Jagannatha-Hora-Software.html), enter birth details, select **Chakras**, and choose **Tripataki**. The online screen currently preserves JHora's recovered D-1 view; the JavaScript example in this repository demonstrates the completed annual progression.

## Sources and methodology

- K. S. Charak, *A Textbook of Varshaphala*, Chapter VIII, “The Tri-Pataki Chakra.”
- JHora native `CTripatakiChakraView`, `FUN_00481670`, `FUN_00491150`, and the recovered Tajaka solar-return path.
- VedAstro's public calculation API for natal positions, solar return and Varsha Lagna.

## Disclaimer

Astrology is a traditional interpretive practice, not a scientifically validated method of prediction. This project is published for education, software preservation and reproducible technical research.
