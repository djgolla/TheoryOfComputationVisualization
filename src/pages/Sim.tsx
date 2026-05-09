import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipForward, RotateCcw, Wand2, Download, Upload, Trash2 } from "lucide-react";
import Graph from "../components/Graph";
import {
  Machine, Mode, simDFA, simNFA, simTM, nfaToDFA,
  EPSILON, BLANK,
} from "../lib/automata";
import { EXAMPLES, blankMachine } from "../lib/examples";

// keeps all the simulator state in one place. 
export default function Sim() {
  const [mode, setMode] = useState<Mode>("DFA");
  const [machine, setMachine] = useState<Machine>(() => blankMachine("DFA"));
  const [selected, setSelected] = useState<{ kind: "state" | "tran"; id: string } | null>(null);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // run sim on every change
  const result = useMemo(() => {
    if (mode === "DFA") return simDFA(machine as any, input);
    if (mode === "NFA") return simNFA(machine as any, input);
    return simTM(machine as any, input);
  }, [mode, machine, input]);

  const trace: any[] = result.trace;
  const maxStep = Math.max(0, trace.length - 1);

  useEffect(() => { setStep(0); setPlaying(false); }, [mode, machine, input]);

  // playback timer
  useEffect(() => {
    if (!playing) return;
    if (step >= maxStep) { setPlaying(false); return; }
    const t = setTimeout(() => setStep(s => Math.min(s + 1, maxStep)), 600);
    return () => clearTimeout(t);
  }, [playing, step, maxStep]);

  // currently active states
  const active = useMemo(() => {
    const t = trace[step];
    if (!t) return new Set<string>();
    if (mode === "NFA") return new Set<string>(t.states ?? []);
    return new Set<string>([t.state]);
  }, [trace, step, mode]);

  // ---- machine mutations (kept inline) ----
  function changeMode(m: Mode) {
    setMode(m);
    setMachine(blankMachine(m));
    setSelected(null);
    setInput("");
  }

  function addState(x: number, y: number) {
    const nums = machine.states.map(s => parseInt(s.id.replace(/\D/g, "")) || 0);
    const id = `q${Math.max(-1, ...nums) + 1}`;
    const ns = { id, label: id, isStart: false, isAccept: false, x, y };
    setMachine({ ...machine, states: [...machine.states, ns] } as Machine);
  }

  function patchState(id: string, p: any) {
    const states = machine.states.map(s => (s.id === id ? { ...s, ...p } : s));
    // only one start state allowed
    if (p.isStart) for (const s of states) if (s.id !== id) s.isStart = false;
    setMachine({ ...machine, states } as Machine);
  }

  function delState(id: string) {
    setMachine({
      ...machine,
      states: machine.states.filter(s => s.id !== id),
      transitions: (machine.transitions as any[]).filter(t => t.from !== id && t.to !== id),
    } as Machine);
    setSelected(null);
  }

  function addTran(from: string, to: string) {
    const id = `t${Date.now()}`;
    if (mode === "TM") {
      const tr = { id, from, to, read: BLANK, write: BLANK, move: "R" as const };
      setMachine({ ...(machine as any), transitions: [...(machine as any).transitions, tr] });
    } else {
      const sym = mode === "NFA" ? EPSILON : "a";
      const tr = { id, from, to, symbol: sym };
      setMachine({ ...(machine as any), transitions: [...(machine as any).transitions, tr] });
    }
    setSelected({ kind: "tran", id });
  }

  function patchTran(id: string, p: any) {
    const transitions = (machine.transitions as any[]).map(t => (t.id === id ? { ...t, ...p } : t));
    setMachine({ ...machine, transitions } as any);
  }

  function delTran(id: string) {
    setMachine({ ...machine, transitions: (machine.transitions as any[]).filter(t => t.id !== id) } as any);
    setSelected(null);
  }

  // import / export / load / convert
  function exportJSON() {
    const blob = new Blob([JSON.stringify(machine, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${machine.type.toLowerCase()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    f.text().then(txt => {
      try {
        const m = JSON.parse(txt) as Machine;
        setMode(m.type);
        setMachine(m);
        setSelected(null);
      } catch { alert("bad file"); }
    });
    e.target.value = "";
  }

  function loadExample(id: string) {
    const ex = EXAMPLES.find(e => e.id === id);
    if (!ex) return;
    setMode(ex.machine.type);
    setMachine(ex.machine);
    setInput(ex.testInput);
    setSelected(null);
  }

  function doConvert() {
    if (mode !== "NFA") { alert("switch to NFA mode first"); return; }
    const dfa = nfaToDFA(machine as any);
    setMode("DFA");
    setMachine(dfa);
    setSelected(null);
  }

  // ---- render ----
  // ,,: if we're at the final step, show actual result. otherwise running.
  const atEnd = step >= maxStep;
  const verdict = atEnd ? (result.accepted ? "accepted" : "rejected") : "running…";

  return (
    <div className="flex-1 flex">
      {/* left side: graph */}
      <div className="flex-1 relative bg-white border-r border-neutral-200">
        <Graph
          machine={machine}
          mode={mode}
          activeStates={active}
          selected={selected}
          onAddState={addState}
          onMoveState={(id, x, y) => patchState(id, { x, y })}
          onAddTran={addTran}
          onSelect={setSelected}
        />
      </div>

      {/* right side: controls */}
      <div className="w-[360px] bg-gray-50 border-l border-neutral-200 overflow-auto">
        <div className="p-4 space-y-4">

          {/* mode + actions */}
          <div>
            <div className="flex gap-1 mb-3">
              {(["DFA","NFA","TM"] as Mode[]).map(m => (
                <button key={m} onClick={() => changeMode(m)}
                  className={`flex-1 px-3 py-1.5 rounded text-sm border ${
                    mode === m
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                  }`}>
                  {m}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <select onChange={e => e.target.value && loadExample(e.target.value)} value=""
                className="border border-neutral-300 rounded px-2 py-1 bg-white">
                <option value="">Load example…</option>
                {EXAMPLES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <button onClick={doConvert} className="px-2 py-1 border border-neutral-300 rounded bg-white hover:bg-neutral-50 inline-flex items-center gap-1">
                <Wand2 className="w-3 h-3" /> NFA→DFA
              </button>
              <button onClick={exportJSON} className="px-2 py-1 border border-neutral-300 rounded bg-white hover:bg-neutral-50" title="Export">
                <Download className="w-3 h-3" />
              </button>
              <button onClick={() => fileRef.current?.click()} className="px-2 py-1 border border-neutral-300 rounded bg-white hover:bg-neutral-50" title="Import">
                <Upload className="w-3 h-3" />
              </button>
              <input ref={fileRef} type="file" accept="application/json" onChange={importJSON} className="hidden" />
              <button onClick={() => { if (confirm("clear machine?")) { setMachine(blankMachine(mode)); setInput(""); setSelected(null); } }}
                className="px-2 py-1 border border-neutral-300 rounded bg-white hover:bg-neutral-50" title="Reset">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* simulator */}
          <Section title="Simulator">
            <label className="text-xs text-neutral-600">Input string</label>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={mode === "TM" ? "aabb" : "1101"}
              className="w-full mt-1 px-2 py-1.5 border border-neutral-300 rounded font-mono text-sm bg-white"
            />

            <div className="flex gap-1 mt-2">
              <button onClick={() => setPlaying(p => !p)} disabled={maxStep === 0}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white text-sm rounded">
                {playing ? <><Pause className="w-3.5 h-3.5"/> pause</> : <><Play className="w-3.5 h-3.5"/> play</>}
              </button>
              <button onClick={() => setStep(s => Math.min(s + 1, maxStep))} className="px-2 py-1.5 border border-neutral-300 bg-white hover:bg-neutral-50 rounded" title="Step">
                <SkipForward className="w-3.5 h-3.5"/>
              </button>
              <button onClick={() => { setStep(0); setPlaying(false); }} className="px-2 py-1.5 border border-neutral-300 bg-white hover:bg-neutral-50 rounded" title="Reset">
                <RotateCcw className="w-3.5 h-3.5"/>
              </button>
            </div>

            <div className="text-xs text-neutral-600 mt-2 font-mono">
              step {step} / {maxStep}
            </div>

            {/* verdict */}
            <div className={`mt-2 px-2 py-1.5 rounded text-sm border ${
              verdict === "accepted" ? "bg-green-50 border-green-300 text-green-800"
              : verdict === "rejected" ? "bg-red-50 border-red-300 text-red-800"
              : "bg-neutral-50 border-neutral-300 text-neutral-700"
            }`}>
              <span className="font-semibold">{verdict}</span>
              {result.reason && verdict === "rejected" && (
                <span className="block text-xs mt-0.5">{result.reason}</span>
              )}
            </div>

            {/* tape view for TM */}
            {mode === "TM" && trace[step] && <Tape tape={trace[step].tape} head={trace[step].head} />}

            {/* trace */}
            <div className="mt-2 max-h-48 overflow-auto border border-neutral-200 rounded bg-white">
              {trace.map((t, i) => (
                <button key={i} onClick={() => setStep(i)}
                  className={`w-full text-left px-2 py-0.5 font-mono text-xs flex justify-between ${
                    i === step ? "bg-indigo-100"
                    : t.dead ? "bg-red-50 text-red-700"
                    : "hover:bg-neutral-50"
                  }`}>
                  <span className="text-neutral-400 w-6">{i}</span>
                  <span className="flex-1 truncate">
                    {t.dead ? "✗ dead end"
                      : mode === "NFA" ? `{${(t.states || []).join(",")}}`
                      : t.state}
                  </span>
                  <span className="text-neutral-500 ml-2">
                    {mode === "TM" ? t.action : t.sym ? `'${t.sym}'` : "·"}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* editor for selected thing */}
          <Section title="Edit selection">
            <SelectionEditor
              machine={machine}
              mode={mode}
              selected={selected}
              onPatchState={patchState}
              onDelState={delState}
              onPatchTran={patchTran}
              onDelTran={delTran}
            />
          </Section>

          {/* tips */}
          <div className="text-xs text-neutral-500 leading-relaxed">
            <p className="font-semibold text-neutral-600 mb-1">Tips</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Double-click empty canvas to add a state</li>
              <li>Drag from a state to another to make a transition</li>
              <li>Click a state or arrow to edit it</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">{title}</div>
      {children}
    </div>
  );
}

function Tape({ tape, head }: { tape: string[]; head: number }) {
  // window the tape so we don't render forever
  const start = Math.max(0, head - 6);
  const end = Math.min(tape.length, head + 7);
  return (
    <div className="mt-2">
      <div className="text-xs text-neutral-600 mb-1">Tape</div>
      <div className="flex gap-0.5 overflow-x-auto">
        {tape.slice(start, end).map((c, i) => {
          const idx = i + start;
          const isHead = idx === head;
          return (
            <div key={idx}
              className={`w-7 h-8 flex items-center justify-center font-mono text-sm border ${
                isHead ? "bg-indigo-600 text-white border-indigo-700"
                : "bg-white border-neutral-300"
              }`}>{c}</div>
          );
        })}
      </div>
    </div>
  );
}

function SelectionEditor({ machine, mode, selected, onPatchState, onDelState, onPatchTran, onDelTran }: any) {
  if (!selected) return <p className="text-xs text-neutral-500 italic">Click a state or transition.</p>;

  if (selected.kind === "state") {
    const s = machine.states.find((x: any) => x.id === selected.id);
    if (!s) return null;
    return (
      <div className="space-y-2 text-sm">
        <div>
          <label className="text-xs text-neutral-600">Label</label>
          <input value={s.label} onChange={e => onPatchState(s.id, { label: e.target.value || s.id })}
            className="w-full mt-1 px-2 py-1 border border-neutral-300 rounded font-mono text-sm bg-white" />
        </div>
        <div className="flex gap-1">
          <button onClick={() => onPatchState(s.id, { isStart: !s.isStart })}
            className={`flex-1 px-2 py-1 text-xs rounded border ${s.isStart ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-neutral-300 hover:bg-neutral-50"}`}>
            start
          </button>
          <button onClick={() => onPatchState(s.id, { isAccept: !s.isAccept })}
            className={`flex-1 px-2 py-1 text-xs rounded border ${s.isAccept ? "bg-green-600 text-white border-green-600" : "bg-white border-neutral-300 hover:bg-neutral-50"}`}>
            accept
          </button>
        </div>
        <button onClick={() => onDelState(s.id)} className="w-full px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded">
          delete state
        </button>
      </div>
    );
  }

  // transition
  const t = (machine.transitions as any[]).find(x => x.id === selected.id);
  if (!t) return null;
  if (mode === "TM") {
    return (
      <div className="space-y-2 text-sm">
        <Row label="Read" value={t.read} onChange={(v: string) => onPatchTran(t.id, { read: v.slice(-1) || "_" })} />
        <Row label="Write" value={t.write} onChange={(v: string) => onPatchTran(t.id, { write: v.slice(-1) || "_" })} />
        <div>
          <label className="text-xs text-neutral-600">Move</label>
          <div className="flex gap-1 mt-1">
            {(["L","S","R"] as const).map(m => (
              <button key={m} onClick={() => onPatchTran(t.id, { move: m })}
                className={`flex-1 px-2 py-1 text-xs rounded border ${t.move === m ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-neutral-300 hover:bg-neutral-50"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => onDelTran(t.id)} className="w-full px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded">
          delete transition
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <Row label={`Symbol${mode === "NFA" ? "  (ε for epsilon)" : ""}`}
           value={t.symbol}
           onChange={(v: string) => onPatchTran(t.id, { symbol: v.slice(-1) || (mode === "NFA" ? EPSILON : "a") })} />
      {mode === "NFA" && (
        <button onClick={() => onPatchTran(t.id, { symbol: EPSILON })}
          className="w-full px-2 py-1 text-xs bg-white border border-neutral-300 hover:bg-neutral-50 rounded">
          set ε
        </button>
      )}
      <button onClick={() => onDelTran(t.id)} className="w-full px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded">
        delete transition
      </button>
    </div>
  );
}

function Row({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-neutral-600">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full mt-1 px-2 py-1 border border-neutral-300 rounded font-mono text-sm bg-white" />
    </div>
  );
}