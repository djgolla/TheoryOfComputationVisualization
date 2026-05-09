// all the automata logic in one file. easier to find stuff than split around.

// types
export type StateId = string;
export type Mode = "DFA" | "NFA" | "TM";

export interface AState {
  id: StateId;
  label: string;
  isStart: boolean;
  isAccept: boolean;
  x: number;
  y: number;
}

export interface FATran  { id: string; from: StateId; to: StateId; symbol: string; }
export interface TMTran  { id: string; from: StateId; to: StateId; read: string; write: string; move: "L" | "R" | "S"; }

export interface FA { type: "DFA" | "NFA"; states: AState[]; transitions: FATran[]; }
export interface TM { type: "TM"; states: AState[]; transitions: TMTran[]; blank: string; }
export type Machine = FA | TM;

export const EPSILON = "ε";
export const BLANK = "_";

export interface FAStep {
  state: StateId;
  consumed: string;
  remaining: string;
  sym: string | null;
  states?: StateId[];
  dead?: boolean;
}
export interface FAResult { accepted: boolean; halted: boolean; trace: FAStep[]; reason?: string; }

// ---------- DFA ----------
export function simDFA(fa: FA, input: string): FAResult {
  const start = fa.states.find(s => s.isStart);
  if (!start) return { accepted: false, halted: true, trace: [], reason: "no start state" };

  let cur = start.id;
  const trace: FAStep[] = [{ state: cur, consumed: "", remaining: input, sym: null }];

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    const matches = fa.transitions.filter(t => t.from === cur && t.symbol === c);

    if (matches.length === 0) {
      trace.push({
        state: cur,
        consumed: input.slice(0, i),
        remaining: input.slice(i),
        sym: c,
        dead: true,
      });
      return { accepted: false, halted: true, trace, reason: `no transition from ${labelOf(fa, cur)} on '${c}'` };
    }
    if (matches.length > 1) {
      return { accepted: false, halted: true, trace, reason: `multiple transitions on '${c}' (not deterministic)` };
    }
    cur = matches[0].to;
    trace.push({ state: cur, consumed: input.slice(0, i + 1), remaining: input.slice(i + 1), sym: c });
  }

  const last = fa.states.find(s => s.id === cur)!;
  return { accepted: last.isAccept, halted: true, trace };
}

// ---------- NFA ----------
function eclose(fa: FA, set: Set<StateId>): Set<StateId> {
  const out = new Set(set);
  const stack = [...set];
  while (stack.length) {
    const s = stack.pop()!;
    for (const t of fa.transitions) {
      if (t.from === s && t.symbol === EPSILON && !out.has(t.to)) {
        out.add(t.to);
        stack.push(t.to);
      }
    }
  }
  return out;
}

function moveOn(fa: FA, set: Set<StateId>, c: string): Set<StateId> {
  const out = new Set<StateId>();
  for (const t of fa.transitions) {
    if (set.has(t.from) && t.symbol === c) out.add(t.to);
  }
  return out;
}

export function simNFA(fa: FA, input: string): FAResult {
  const start = fa.states.find(s => s.isStart);
  if (!start) return { accepted: false, halted: true, trace: [], reason: "no start state" };

  let cur = eclose(fa, new Set([start.id]));
  const trace: FAStep[] = [{ state: "", consumed: "", remaining: input, sym: null, states: [...cur] }];

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    const next = eclose(fa, moveOn(fa, cur, c));
    if (next.size === 0) {
      trace.push({
        state: "",
        consumed: input.slice(0, i),
        remaining: input.slice(i),
        sym: c,
        states: [],
        dead: true,
      });
      return { accepted: false, halted: true, trace, reason: `dead end on '${c}'` };
    }
    cur = next;
    trace.push({ state: "", consumed: input.slice(0, i + 1), remaining: input.slice(i + 1), sym: c, states: [...cur] });
  }

  const accepted = [...cur].some(id => fa.states.find(s => s.id === id)?.isAccept);
  return { accepted, halted: true, trace };
}

// ---------- NFA -> DFA (subset construction) ----------
export function nfaToDFA(nfa: FA): FA {
  const start = nfa.states.find(s => s.isStart);
  if (!start) return { type: "DFA", states: [], transitions: [] };

  const alpha = [...new Set(nfa.transitions.map(t => t.symbol).filter(s => s !== EPSILON))].sort();
  const key = (set: Set<string>) => [...set].sort().join(",");

  const startSet = eclose(nfa, new Set([start.id]));
  const ids = new Map<string, string>();
  ids.set(key(startSet), "d0");

  const queue: Set<string>[] = [startSet];
  const dStates: AState[] = [];
  const dTrans: FATran[] = [];
  let i = 0;

  while (queue.length) {
    const cur = queue.shift()!;
    const k = key(cur);
    const id = ids.get(k)!;
    if (dStates.find(s => s.id === id)) continue;

    const labels = [...cur].map(x => nfa.states.find(s => s.id === x)?.label ?? x);
    dStates.push({
      id,
      label: labels.length === 0 ? "∅" : `{${labels.join(",")}}`,
      isStart: k === key(startSet),
      isAccept: [...cur].some(x => nfa.states.find(s => s.id === x)?.isAccept),
      x: 120 + (i % 4) * 220,
      y: 120 + Math.floor(i / 4) * 180,
    });
    i++;

    for (const a of alpha) {
      const nxt = eclose(nfa, moveOn(nfa, cur, a));
      if (nxt.size === 0) continue;
      const nk = key(nxt);
      if (!ids.has(nk)) { ids.set(nk, `d${ids.size}`); queue.push(nxt); }
      dTrans.push({ id: `${id}-${a}-${ids.get(nk)}`, from: id, to: ids.get(nk)!, symbol: a });
    }
  }

  return { type: "DFA", states: dStates, transitions: dTrans };
}

// ---------- TM ----------
export interface TMStep { state: StateId; tape: string[]; head: number; action: string; halted: boolean; accepted: boolean; }
export interface TMResult { accepted: boolean; halted: boolean; trace: TMStep[]; reason?: string; }

const TM_LIMIT = 3000;

export function simTM(tm: TM, input: string): TMResult {
  const start = tm.states.find(s => s.isStart);
  if (!start) return { accepted: false, halted: true, trace: [], reason: "no start state" };

  const blank = tm.blank || BLANK;
  let tape = input.length === 0 ? [blank] : input.split("");
  let head = 0;
  let cur = start.id;
  const trace: TMStep[] = [{ state: cur, tape: [...tape], head, action: "start", halted: false, accepted: false }];

  for (let s = 0; s < TM_LIMIT; s++) {
    const so = tm.states.find(x => x.id === cur)!;
    if (so.isAccept) {
      trace.push({ state: cur, tape: [...tape], head, action: "accept", halted: true, accepted: true });
      return { accepted: true, halted: true, trace };
    }
    if (head < 0) { tape.unshift(blank); head = 0; }
    while (head >= tape.length) tape.push(blank);

    const r = tape[head];
    const t = tm.transitions.find(x => x.from === cur && x.read === r);
    if (!t) {
      trace.push({ state: cur, tape: [...tape], head, action: `reject (no rule on '${r}')`, halted: true, accepted: false });
      return { accepted: false, halted: true, trace, reason: `no rule from ${so.label} reading '${r}'` };
    }

    tape[head] = t.write;
    if (t.move === "L") head--;
    else if (t.move === "R") head++;
    cur = t.to;

    if (head < 0) { tape.unshift(blank); head = 0; }
    while (head >= tape.length) tape.push(blank);

    trace.push({ state: cur, tape: [...tape], head, action: `${r}→${t.write},${t.move}`, halted: false, accepted: false });
  }
  return { accepted: false, halted: false, trace, reason: `step limit (${TM_LIMIT}) reached` };
}

function labelOf(fa: FA, id: StateId) {
  return fa.states.find(s => s.id === id)?.label ?? id;
}