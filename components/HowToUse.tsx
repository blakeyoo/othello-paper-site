export default function HowToUse() {
  return (
    <section id="how-to-use" className="py-20 px-6 border-b border-gray-100 bg-white">
      <div className="max-w-3xl mx-auto">

        <h2 className="text-2xl font-bold mb-1 text-gray-900">How to Use</h2>
        <p className="text-gray-500 text-sm mb-6">Installation &amp; Quick Start</p>

        <p className="text-base text-gray-600 mb-12 leading-relaxed">
          Please check{" "}
          <a
            href="https://github.com/blakeyoo/ExpandedOthello-AEC"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium px-3 py-0.5 rounded-md transition-colors text-sm align-middle"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            Environment
          </a>
          {" "}for the detailed guidelines.
        </p>

        {/* Installation */}
        <div className="mb-12">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Installation</h3>
          <pre className="bg-gray-900 text-gray-100 rounded-lg px-5 py-4 text-sm font-mono overflow-x-auto leading-relaxed">
            <span className="text-gray-500 select-none"># Install directly from GitHub{"\n"}</span>
            <span>pip install git+https://github.com/blakeyoo/ExpandedOthello-AEC.git</span>
          </pre>
          <p className="text-xs text-gray-400 mt-2">Requires Python ≥ 3.9 · numpy · numba · pettingzoo · gymnasium</p>
        </div>

        {/* Load a preset */}
        <div className="mb-12">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Load a Benchmark Environment</h3>
          <p className="text-sm text-gray-500 mb-4">
            56 preset environments are available — the Cartesian product of 7 board layouts and 8 win conditions.
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg px-5 py-4 text-sm font-mono overflow-x-auto leading-relaxed">
            <span className="text-indigo-400">from</span>
            {" expanded_othello "}
            <span className="text-indigo-400">import</span>
            {" load_preset\n\n"}
            <span className="text-gray-500 select-none"># Load one of 56 official environments (index 0–55){"\n"}</span>
            {"env = load_preset(0)\n\n"}
            {"obs, _ = env.reset()\n"}
            <span className="text-indigo-400">while</span>
            {" env.agents:\n"}
            {"    agent = env.agent_selection\n"}
            {"    action_mask = obs["}
            <span className="text-amber-400">&quot;action_mask&quot;</span>
            {"]\n"}
            {"    action = your_agent.act(obs, action_mask)\n"}
            {"    env.step(action)\n"}
            {"    obs, reward, term, trunc, _ = env.last()"}
          </pre>
        </div>

        {/* Custom environment */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Custom Environment</h3>
          <p className="text-sm text-gray-500 mb-4">
            Define your own board geometry and win condition beyond the preset suite.
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg px-5 py-4 text-sm font-mono overflow-x-auto leading-relaxed">
            <span className="text-indigo-400">from</span>
            {" expanded_othello "}
            <span className="text-indigo-400">import</span>
            {" make_env\n\n"}
            {"env = make_env(\n"}
            {"    board_size=("}
            <span className="text-amber-400">10</span>
            {", "}
            <span className="text-amber-400">10</span>
            {"),\n"}
            {"    obstacles=[("}
            <span className="text-amber-400">0</span>
            {", "}
            <span className="text-amber-400">0</span>
            {"), ("}
            <span className="text-amber-400">9</span>
            {", "}
            <span className="text-amber-400">9</span>
            {")],\n"}
            {"    win_cond="}
            <span className="text-amber-400">0.6</span>
            {",\n"}
            {"    n_turns="}
            <span className="text-amber-400">-1</span>
            {",\n"}
            {")"}
          </pre>
        </div>

      </div>
    </section>
  );
}
