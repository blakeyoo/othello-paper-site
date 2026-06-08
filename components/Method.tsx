const contributions = [
  {
    tag: "Benchmark",
    title: "56-Environment Parametric Suite",
    body: (
      <>
        Environments are constructed from a two-factor framework{" "}
        <span className="font-mono text-indigo-600">E = (L, C)</span>. The geometry factor{" "}
        <span className="font-mono">L</span> varies board size (square and rectangular) and
        obstacle patterns (corners, C-squares, X-squares, random). The condition factor{" "}
        <span className="font-mono">C</span> encodes a latent disc-ratio threshold{" "}
        <span className="font-mono">K</span> that determines the winning range—unknown to the
        agent at test time.
      </>
    ),
  },
  {
    tag: "Metric",
    title: "Skill-Acquisition Efficiency (SAE)",
    body: (
      <>
        SAE measures how much win-rate an agent gains per environment interaction under a strict
        budget. Unlike final win-rate alone, SAE penalises slow learners and rewards agents that
        generalise quickly to unseen{" "}
        <span className="font-mono text-indigo-600">(L, C)</span> combinations—directly
        reflecting real-world deployment constraints.
      </>
    ),
  },
  {
    tag: "Baseline",
    title: "Neuroevolutionary Adaptive-Minimax",
    body: (
      <>
        Our proposed agent combines two learned components. <strong>PosNet</strong> is a
        population of positional value networks meta-evolved across randomised board layouts,
        providing spatial priors that transfer to unseen geometries. <strong>WeightNet</strong>{" "}
        learns environment-specific evaluation weights through neuroevolution, adapting the
        Minimax search to inferred winning conditions without explicit supervision.
      </>
    ),
  },
  {
    tag: "Evaluation",
    title: "Cross-Environment Generalisation",
    body: (
      <>
        All agents are trained on a subset of environments and evaluated on held-out{" "}
        <span className="font-mono text-indigo-600">(L, C)</span> combinations. Baselines
        include a random agent, a positional-greedy agent, MCTS, and PPO. The adaptive-Minimax
        agent is compared against these baselines on SAE across all 56 environments.
      </>
    ),
  },
];

export default function Method() {
  return (
    <section id="method" className="py-20 px-6 bg-white border-b border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Method</h2>
        <p className="text-gray-500 text-sm mb-10">Key contributions of this work.</p>

        <div className="space-y-8">
          {contributions.map(({ tag, title, body }) => (
            <div key={tag} className="flex gap-5">
              <div className="pt-0.5 shrink-0">
                <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-200">
                  {tag}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-gray-600 leading-7 text-sm">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
