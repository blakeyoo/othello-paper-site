type WDL = { w: number; d: number; l: number };

const PPO_CONDITIONS: {
  label: string;
  note: string;
  random: WDL;
  am: WDL;
  mcts: WDL;
}[] = [
  { label: "Majority (K > 1.0)",       note: "",
    random: { w: 78.6, d:  2.9, l: 18.6 },
    am:     { w: 14.3, d:  0.0, l: 85.7 },
    mcts:   { w: 17.1, d:  2.1, l: 80.7 } },
  { label: "Minority (K < 0)",          note: "",
    random: { w: 75.0, d:  2.9, l: 22.1 },
    am:     { w:  7.1, d:  0.0, l: 92.9 },
    mcts:   { w:  5.7, d:  0.7, l: 93.6 } },
  { label: "Majority / Blitz",          note: "",
    random: { w: 61.4, d: 20.0, l: 18.6 },
    am:     { w:  0.0, d: 14.3, l: 85.7 },
    mcts:   { w: 16.4, d: 15.0, l: 68.6 } },
  { label: "Minority / Blitz",          note: "",
    random: { w: 65.7, d: 18.6, l: 15.7 },
    am:     { w:  7.1, d: 14.3, l: 78.6 },
    mcts:   { w: 25.0, d: 10.0, l: 65.0 } },
  { label: "Majority < 80% (K = 0.8)", note: "",
    random: { w: 68.6, d: 10.0, l: 21.4 },
    am:     { w:  7.1, d: 28.6, l: 64.3 },
    mcts:   { w: 15.7, d:  5.0, l: 79.3 } },
  { label: "Minority > 20% (K = 0.2)", note: "",
    random: { w: 70.7, d:  9.3, l: 20.0 },
    am:     { w: 21.4, d: 14.3, l: 64.3 },
    mcts:   { w:  6.4, d:  3.6, l: 90.0 } },
  { label: "Majority < 60% (K = 0.6)", note: "narrow",
    random: { w: 23.6, d: 52.9, l: 23.6 },
    am:     { w:  7.1, d: 92.9, l:  0.0 },
    mcts:   { w:  2.9, d: 23.6, l: 73.6 } },
  { label: "Minority > 40% (K = 0.4)", note: "narrow",
    random: { w: 26.4, d: 57.9, l: 15.7 },
    am:     { w:  7.1, d: 78.6, l: 14.3 },
    mcts:   { w:  3.6, d: 28.6, l: 67.9 } },
];

const CONDITIONS: {
  label: string;
  note: string;
  random: WDL;
  ppo: WDL;
  mcts: WDL;
}[] = [
  { label: "Majority (K > 1.0)",       note: "",
    random: { w: 95.7, d:  1.4, l:  2.9 },
    ppo:    { w: 85.7, d:  0.0, l: 14.3 },
    mcts:   { w: 78.6, d:  0.7, l: 20.7 } },
  { label: "Minority (K < 0)",          note: "",
    random: { w: 94.3, d:  2.1, l:  3.6 },
    ppo:    { w: 92.9, d:  0.0, l:  7.1 },
    mcts:   { w: 55.7, d:  3.6, l: 40.7 } },
  { label: "Majority / Blitz",          note: "",
    random: { w: 90.0, d:  6.4, l:  3.6 },
    ppo:    { w: 85.7, d: 14.3, l:  0.0 },
    mcts:   { w: 56.4, d: 32.1, l: 11.4 } },
  { label: "Minority / Blitz",          note: "",
    random: { w: 84.3, d: 12.1, l:  3.6 },
    ppo:    { w: 78.6, d: 14.3, l:  7.1 },
    mcts:   { w: 55.7, d: 10.7, l: 33.6 } },
  { label: "Majority < 80% (K = 0.8)", note: "",
    random: { w: 54.3, d: 35.7, l: 10.0 },
    ppo:    { w: 64.3, d: 28.6, l:  7.1 },
    mcts:   { w: 44.3, d: 20.0, l: 35.7 } },
  { label: "Minority > 20% (K = 0.2)", note: "",
    random: { w: 77.9, d: 16.4, l:  5.7 },
    ppo:    { w: 64.3, d: 14.3, l: 21.4 },
    mcts:   { w: 45.0, d: 24.3, l: 30.7 } },
  { label: "Majority < 60% (K = 0.6)", note: "narrow",
    random: { w: 19.3, d: 73.6, l:  7.1 },
    ppo:    { w:  0.0, d: 92.9, l:  7.1 },
    mcts:   { w: 13.6, d: 67.9, l: 18.6 } },
  { label: "Minority > 40% (K = 0.4)", note: "narrow",
    random: { w: 18.6, d: 72.9, l:  8.6 },
    ppo:    { w: 14.3, d: 78.6, l:  7.1 },
    mcts:   { w:  8.6, d: 60.0, l: 31.4 } },
];

function WDLBar({ wdl }: { wdl: WDL }) {
  return (
    <div>
      <div className="relative h-3 w-full rounded-full overflow-hidden bg-gray-200 flex">
        <div className="h-full bg-emerald-500" style={{ width: `${wdl.w}%` }} />
        <div className="h-full bg-gray-300"    style={{ width: `${wdl.d}%` }} />
        <div className="h-full bg-red-400"     style={{ width: `${wdl.l}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
        <span className="text-emerald-600">{wdl.w}%</span>
        <span className="text-gray-400">{wdl.d}%</span>
        <span className="text-red-400">{wdl.l}%</span>
      </div>
    </div>
  );
}

export default function Results() {
  return (
    <section id="results" className="py-20 px-6 border-b border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-1 text-gray-900">Possible Approaches</h2>
        <p className="text-gray-500 text-sm mb-12">What works, what doesn't, and where the open problems are</p>

        <div className="space-y-6 text-gray-700 leading-8 text-[1.05rem] mb-10">
          <p>
            To demonstrate the benchmark's utility, we introduce a neuroevolutionary
            Adaptive Minimax as a foundational baseline. It combines two components:
            a population of positional value networks meta-evolved across diverse board
            layouts (<strong>PosNet</strong>), providing spatial priors that transfer to
            unseen geometries; and an adaptive utility-weighting mechanism that evolves
            within each environment to infer the latent winning condition
            (<strong>WeightNet</strong>). Together, they allow the agent to adapt both
            spatially and strategically from terminal outcomes alone.
          </p>
          <p>
            In broad regimes — standard, inverse, and blitz conditions — the Adaptive Minimax
            converges rapidly, often reaching high win rates within the first generation of
            updates. Notably, it achieves win rates comparable to MCTS-100 despite MCTS
            having direct simulator access to the latent threshold K during search.
            The contrast with PPO is stark: trained under the same 2,000-game budget,
            PPO's win rate curves plateau early and remain largely flat — sparse terminal
            rewards provide insufficient gradient signal for meaningful adaptation within
            the budget, even when training is extended to 10,000 games.
          </p>
        </div>

        {/* Convergence figure */}
        <figure className="mb-10">
          <img
            src="/MiniMaxPPO.png"
            alt="Convergence speed of Adaptive Minimax and PPO"
            className="w-full rounded-lg border border-gray-200"
          />
          <figcaption className="mt-3 text-xs text-gray-400 leading-relaxed">
            Convergence speed of Adaptive Minimax (left) and PPO (right) under increasing
            training budgets, measured by win rate against Random (top) and MCTS-100 (bottom).
            Each curve is averaged over the 7 environments sharing the same victory condition C.
            For the Minimax, each generation requires 100 games.
          </figcaption>
        </figure>

        <div className="space-y-6 text-gray-700 leading-8 text-[1.05rem] mb-14">
          <p>
            Where the Adaptive Minimax falls short is in narrow-interval regimes: at
            K = 0.6 and K = 0.4, win rates collapse and outcomes are dominated by draws.
            The agent learns to avoid losing, but cannot control its terminal disc ratio
            with the precision required to enter the admissible interval consistently.
            These regimes remain an open challenge for all tested approaches.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm bg-emerald-500" /> Win
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm bg-gray-300" /> Draw
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm bg-red-400" /> Lose
          </span>
        </div>

        {/* Adaptive Minimax Table */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Adaptive Minimax</h3>
        <p className="text-gray-500 text-sm mb-6">averaged over 7 layouts per condition · trained with 2,000 games of self-play per environment</p>
        <div className="mb-4">
          <div className="grid grid-cols-[1fr_160px_160px_160px] gap-x-4 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-4">
            <span>Condition</span>
            <span>vs Random</span>
            <span>vs PPO</span>
            <span>vs MCTS-100</span>
          </div>
          <div className="space-y-3">
            {CONDITIONS.map((c) => (
              <div
                key={c.label}
                className={`grid grid-cols-[1fr_160px_160px_160px] gap-x-4 items-center rounded-lg px-4 py-3 ${
                  c.note === "narrow"
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <span className="text-sm text-gray-800">
                  {c.label}
                  {c.note === "narrow" && (
                    <span className="ml-2 text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                      narrow
                    </span>
                  )}
                </span>
                <WDLBar wdl={c.random} />
                <WDLBar wdl={c.ppo}    />
                <WDLBar wdl={c.mcts}   />
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-14">
          MCTS-100 uses 100 simulations per move with full simulator access to K.
          PPO is trained with 2,000 games of self-play. The Adaptive Minimax infers K from terminal outcomes alone.
        </p>

        {/* PPO Table */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">PPO</h3>
        <p className="text-gray-500 text-sm mb-6">averaged over 7 layouts per condition · trained with 2,000 games of self-play per environment</p>
        <div className="mb-4">
          <div className="grid grid-cols-[1fr_160px_160px_160px] gap-x-4 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-4">
            <span>Condition</span>
            <span>vs Random</span>
            <span>vs Adaptive Minimax</span>
            <span>vs MCTS-100</span>
          </div>
          <div className="space-y-3">
            {PPO_CONDITIONS.map((c) => (
              <div
                key={c.label}
                className={`grid grid-cols-[1fr_160px_160px_160px] gap-x-4 items-center rounded-lg px-4 py-3 ${
                  c.note === "narrow"
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <span className="text-sm text-gray-800">
                  {c.label}
                  {c.note === "narrow" && (
                    <span className="ml-2 text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                      narrow
                    </span>
                  )}
                </span>
                <WDLBar wdl={c.random} />
                <WDLBar wdl={c.am}     />
                <WDLBar wdl={c.mcts}   />
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-14">
          PPO results are averaged at 2,000 training episodes. Full per-layout breakdown available in the paper.
        </p>

        {/* Key takeaway */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-gray-700 leading-8 text-[1.05rem]">
          <p>
            These results demonstrate that the Arena captures two qualitatively distinct
            adaptation challenges: rapid win-oriented convergence in broad regimes, and
            fragile, draw-heavy occupancy control in narrow ones. The difficulty gradient
            exposed here — and the failure of all tested baselines in the narrowest regimes
            — points to open research problems the Arena is specifically designed to surface.
          </p>
        </div>

      </div>
    </section>
  );
}
