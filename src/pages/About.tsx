export default function About() {
  return (
    <div className="max-w-3xl mx-auto p-8 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold mb-4">About</h1>

      <p className="mb-3">
        This is my honors project for IT 328 — Theory of Computation. The goal was
        to make the abstract machines from the class actually visual so you can
        watch them run instead of just staring at proofs.
      </p>

      <h2 className="font-semibold mt-5 mb-2">Topics it covers</h2>
      <ul className="list-disc list-inside space-y-1 text-neutral-700">
        <li>Deterministic Finite Automata (DFA)</li>
        <li>Nondeterministic Finite Automata (NFA), with ε-transitions</li>
        <li>NFA → DFA via subset construction</li>
        <li>Single-tape Turing machines</li>
      </ul>

      <h2 className="font-semibold mt-5 mb-2">Stack</h2>
      <p className="text-neutral-700">
        React + Vite + Tailwind, react-flow for the graph canvas, react-router for
        pages. No backend, runs in the browser. Source on GitHub.
      </p>

      <h2 className="font-semibold mt-5 mb-2">Notes</h2>
      <p className="text-neutral-700">
        The actual simulation logic lives in{" "}
        <code className="bg-neutral-200 px-1 rounded">src/lib/automata.ts</code>.
        I kept it separate from the React stuff so it's easier to read.
      </p>

      <p className="mt-8 text-neutral-500 text-xs">
        Daniel Golladay · Illinois State University
      </p>
    </div>
  );
}