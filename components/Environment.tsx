export default function Environment() {
  return (
    <section id="environment" className="py-20 px-6 border-b border-gray-100 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-1 text-gray-900">The Environment: The Expanded Othello</h2>
        <p className="text-gray-500 text-sm mb-10">Enviroment formalization and the design rationale</p>

        <div className="space-y-6 text-gray-700 leading-8 text-[1.05rem]">
          <p>
            Evaluating how an AI discovers a latent objective requires going beyond what
            traditional meta-learning environments offer. Visual or structural variation —
            changes to inputs, layouts, or level appearances — leaves the fundamental rules
            of the environment intact. What is needed instead is an environment where the
            rules themselves change: where what counts as winning is not given, and must be
            inferred. Moreover, AGI demands more than single-agent adaptation. Deriving an
            objective from an environment that includes another agent — one whose actions
            are shaped by the same hidden rules — is a qualitatively harder and more
            realistic test of general intelligence.
          </p>

          <p>
            We select Othello as the substrate for the environment to test such abilities
            because it satisfies these requirements. Its terminal state produces a continuous disc occupancy ratio
            ρ ∈ [0, 1] — making the winning condition directly parameterizable through a single
            threshold, and therefore variable in ways that go beyond structural change. It is
            zero-sum and adversarial by construction, requiring adaptation against an opponent
            whose decisions co-determine the outcome. And its flipping mechanics — high global
            state-change dynamics from simple local rules — mean that board geometry directly
            shapes which strategies are viable, making spatial layout a meaningful variable
            rather than mere decoration.
          </p>

          <p>
            The environment space is therefore formalized as{" "}
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-sm">ℰ = ℒ × 𝒞</span>.
            Each instance{" "}
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-sm">E = (L, C)</span>
            {" "}is defined by two independently varying components.{" "}
            <strong>L</strong> is the board geometry — the size and shape of the board, along
            with the placement of non-interactive obstacles. It is fully observable, and
            represents the structural dimension of variation familiar from traditional
            meta-learning.{" "}
            <strong>C</strong> is the victory condition — latent and never directly revealed,
            it must be implicitly inferred through interaction. Leveraging Othello's natural
            disc occupancy ratio ρ, the winning criteria is varied across environments through
            a single parameterization <em>K</em>, which determines the threshold that separates
            victory from over-dominance draw conditions, i.e., the winning condition is not simply defined via majority of the discs; it has to stay in a specific ratio region, or strategic draw is often needed for prventing opponent win.
            For detailed definition of <em>K</em>, please refer to our{" "}
            <a
              href="https://openreview.net/forum?id=WXKQtqPC2d"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-gray-500 hover:text-gray-800"
            >
              paper
            </a>.
          </p>
        </div>
      </div>
    </section>
  );
}
