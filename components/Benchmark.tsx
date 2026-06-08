type Zone = { lo: number; hi: number; type: "win" | "lose" | "draw" };

const LAYOUTS = [
  { name: "Standard 8×8",     file: "board_standard.svg",   size: "8×8"   },
  { name: "No Corners",        file: "board_no_corners.svg", size: "8×8"   },
  { name: "Partial C-Squares", file: "board_partial_c.svg",  size: "8×8"   },
  { name: "X-Squares",         file: "board_x_squares.svg",  size: "8×8"   },
  { name: "Random Board 1",    file: "board_random1.svg",    size: "12×10" },
  { name: "Random Board 2",    file: "board_random2.svg",    size: "6×8"   },
  { name: "Random Board 3",    file: "board_random3.svg",    size: "10×10" },
];

const MAJORITY = [
  {
    label: "Majority", k: "K > 1.0", blitz: false,
    desc: "More discs wins — standard Othello.",
    zones: [
      { lo: 0,  hi: 50,  type: "lose" },
      { lo: 50, hi: 100, type: "win"  },
    ] as Zone[],
  },
  {
    label: "Majority < 80%", k: "K = 0.8", blitz: false,
    desc: "Win with majority, but disc ratio must stay below 80%.",
    zones: [
      { lo: 0,  hi: 20,  type: "draw" },
      { lo: 20, hi: 50,  type: "lose" },
      { lo: 50, hi: 80,  type: "win"  },
      { lo: 80, hi: 100, type: "draw" },
    ] as Zone[],
  },
  {
    label: "Majority < 60%", k: "K = 0.6", blitz: false,
    desc: "Narrow window — ratio must land between 50% and 60%.",
    zones: [
      { lo: 0,  hi: 40,  type: "draw" },
      { lo: 40, hi: 50,  type: "lose" },
      { lo: 50, hi: 60,  type: "win"  },
      { lo: 60, hi: 100, type: "draw" },
    ] as Zone[],
  },
  {
    label: "Majority / Blitz", k: "K > 1.0", blitz: true,
    desc: "Standard rules with a hard turn limit.",
    zones: [
      { lo: 0,  hi: 50,  type: "lose" },
      { lo: 50, hi: 100, type: "win"  },
    ] as Zone[],
  },
];

const MINORITY = [
  {
    label: "Minority", k: "K < 0", blitz: false,
    desc: "Fewer discs wins — inverse Othello.",
    zones: [
      { lo: 0,  hi: 50,  type: "win"  },
      { lo: 50, hi: 100, type: "lose" },
    ] as Zone[],
  },
  {
    label: "Minority > 40%", k: "K = 0.4", blitz: false,
    desc: "Win with minority, but disc ratio must stay above 40%.",
    zones: [
      { lo: 0,  hi: 40,  type: "draw" },
      { lo: 40, hi: 50,  type: "win"  },
      { lo: 50, hi: 60,  type: "lose" },
      { lo: 60, hi: 100, type: "draw" },
    ] as Zone[],
  },
  {
    label: "Minority > 20%", k: "K = 0.2", blitz: false,
    desc: "Win with minority, but disc ratio must stay above 20%.",
    zones: [
      { lo: 0,  hi: 20,  type: "draw" },
      { lo: 20, hi: 50,  type: "win"  },
      { lo: 50, hi: 80,  type: "lose" },
      { lo: 80, hi: 100, type: "draw" },
    ] as Zone[],
  },
  {
    label: "Minority / Blitz", k: "K < 0", blitz: true,
    desc: "Inverse rules with a hard turn limit.",
    zones: [
      { lo: 0,  hi: 50,  type: "win"  },
      { lo: 50, hi: 100, type: "lose" },
    ] as Zone[],
  },
];

const ZONE_COLOR: Record<Zone["type"], string> = {
  win:  "bg-emerald-500",
  lose: "bg-red-400",
  draw: "bg-gray-300",
};

function ConditionBar({ zones }: { zones: Zone[] }) {
  return (
    <div className="mt-2 relative h-2 w-full rounded-full bg-gray-100 overflow-hidden">
      {zones.map((z, i) => (
        <div
          key={i}
          className={`absolute h-2 ${ZONE_COLOR[z.type]}`}
          style={{ left: `${z.lo}%`, width: `${z.hi - z.lo}%` }}
        />
      ))}
    </div>
  );
}

function getAxisLabels(zones: Zone[]): number[] {
  const values = new Set<number>([0, 50, 100]);
  zones.forEach(z => { values.add(z.lo); values.add(z.hi); });
  return Array.from(values).sort((a, b) => a - b);
}

function ConditionCard({ label, k, blitz, desc, zones }: typeof MAJORITY[number]) {
  const labels = getAxisLabels(zones);
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-gray-900 text-sm">
          {label}{blitz && <span className="text-gray-400 font-normal"> (10 turn limit)</span>}
        </span>
        <span className="font-mono text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded">
          {k}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{desc}</p>
      <ConditionBar zones={zones} />
      <div className="relative h-4 mt-1">
        {labels.map(v => (
          <span
            key={v}
            className="absolute text-[10px] text-gray-400 -translate-x-1/2"
            style={{ left: `${v}%` }}
          >
            {v}%
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Benchmark() {
  return (
    <section id="benchmark" className="py-20 px-6 border-b border-gray-100 bg-gray-50">
      <div className="max-w-5xl mx-auto">

        <h2 className="text-2xl font-bold mb-1 text-gray-900">The Benchmark</h2>
        <p className="text-gray-500 text-sm mb-12">56 environments · 7 layouts × 8 win conditions</p>

        {/* Intro */}
        <div className="space-y-6 text-gray-700 leading-8 text-[1.05rem] mb-16">
          <p>
            The goal of the benchmark is to measure how quickly an AI adapts to an environment
            with a latent objective — a capability we define as{" "}
            <strong>Skill-Acquisition Efficiency (SAE)</strong>. To quantify this, we evaluate
            the performance an agent achieves when interacting with a given environment under
            a strictly limited number of interactions.
          </p>
          <p>
            Concretely, the interaction budget per environment is fixed at{" "}
            <strong>2,000 games</strong>. Within this budget, the agent learns through
            self-play by default; pre-training on prior environments is permitted. To enable
            systematic and quantified evaluation, we define a standard benchmarking suite of
            56 environments — the Cartesian product of 8 victory conditions (C) and 7 board layouts
            (L) — designed to provide comprehensive coverage across diverse structural and
            objective-level challenges. The conditions are as follows:
          </p>
        </div>

        {/* Layout Space */}
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Layout Space — <span className="font-normal text-gray-500">7 board geometries</span>
        </h3>
        <div className="grid grid-cols-4 gap-4 mb-16 sm:grid-cols-7">
          {LAYOUTS.map((l) => (
            <div key={l.file} className="flex flex-col items-center gap-2">
              <img
                src={`/${l.file}`}
                alt={l.name}
                className="w-full rounded border border-gray-200"
              />
              <p className="text-xs text-center text-gray-600 leading-tight">{l.name}</p>
              <p className="text-xs text-center text-gray-400">{l.size}</p>
            </div>
          ))}
        </div>

        {/* Condition Space */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Condition Space — <span className="font-normal text-gray-500">8 victory conditions</span>
        </h3>
        <div className="flex items-center gap-4 mb-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm bg-emerald-500" /> Win
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm bg-red-400" /> Lose
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm bg-gray-300" /> Draw
          </span>
          <span className="text-gray-400">· x-axis = disc ratio (0% → 100%)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Majority</p>
            {MAJORITY.map((c) => <ConditionCard key={c.label} {...c} />)}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Minority</p>
            {MINORITY.map((c) => <ConditionCard key={c.label} {...c} />)}
          </div>
        </div>

      </div>
    </section>
  );
}
