import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Theory Viz</h1>
      <p className="text-neutral-600 mb-6">
        Small web app for building and stepping through DFAs, NFAs, and Turing machines.
        Made for IT 328 (Theory of Computation).
      </p>

      <div className="bg-white border border-neutral-200 rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">What you can do</h2>
        <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
          <li>Build a DFA / NFA / TM by clicking the canvas</li>
          <li>Type an input string and step through it</li>
          <li>Convert an NFA to a DFA (subset construction)</li>
          <li>Load a few example machines from class</li>
        </ul>
      </div>

      <Link
        to="/sim"
        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm"
      >
        Open simulator →
      </Link>
    </div>
  );
}