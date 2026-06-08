export default function Challenge() {
  return (
    <section id="challenge" className="py-20 px-6 border-b border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-1 text-gray-900">The Challenge</h2>
        <p className="text-gray-500 text-sm mb-10">When the Objective is Unknown</p>

        <div className="space-y-6 text-gray-700 leading-8 text-[1.05rem]">
          <p>
            The capacity for rapid strategic adaptation to a novel, unseen environment is regarded as one of the major properties
            of artificial general intelligence (AGI). Novelty can take many forms — a new task,
            an unfamiliar geometry, or a changed set of rules. But one dimension remains central and
            largely unaddressed: the objective of the environment itself. If what counts as success is unknown, how should an AI — or a human — figure it out, and adapt quickly enough to the environment?
          </p>

          <p>
            The difficulty lies in the nature of the signal. When the objective is unknown, the only evidence is the outcome — what happens at the very end of each attempt. Nothing along the way indicates whether a given approach is on the right track. This is compounded when the result is also shaped by another party — one whose responses to every decision further obscure the objective.
          </p>

          <p>
            We propose the Expanded Othello AI Arena as a benchmark built around this challenge. It is not a test of how well an agent plays Othello. It is a test of how quickly one can identify a hidden objective and develop an effective strategy in an expanded, non-standard variant of Othello with undisclosed winning conditions.
          </p>

        </div>
      </div>
    </section>
  );
}
