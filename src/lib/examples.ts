import { Machine, BLANK } from "./automata";

// preset machines for the dropdown
export interface Preset {
  id: string;
  name: string;
  desc: string;
  machine: Machine;
  testInput: string;
}

export const EXAMPLES: Preset[] = [
  {
    id: "dfa-ends01",
    name: "DFA — ends in 01",
    desc: "Binary strings ending with 01",
    testInput: "11001",
    machine: {
      type: "DFA",
      states: [
        { id: "q0", label: "q0", isStart: true,  isAccept: false, x: 100, y: 220 },
        { id: "q1", label: "q1", isStart: false, isAccept: false, x: 320, y: 220 },
        { id: "q2", label: "q2", isStart: false, isAccept: true,  x: 540, y: 220 },
      ],
      transitions: [
        { id: "1", from: "q0", to: "q0", symbol: "1" },
        { id: "2", from: "q0", to: "q1", symbol: "0" },
        { id: "3", from: "q1", to: "q1", symbol: "0" },
        { id: "4", from: "q1", to: "q2", symbol: "1" },
        { id: "5", from: "q2", to: "q1", symbol: "0" },
        { id: "6", from: "q2", to: "q0", symbol: "1" },
      ],
    },
  },
  {
    id: "dfa-divby3",
    name: "DFA — binary ÷ by 3",
    desc: "Accepts binary numbers divisible by 3",
    testInput: "110",
    machine: {
      type: "DFA",
      states: [
        { id: "q0", label: "r0", isStart: true,  isAccept: true,  x: 120, y: 240 },
        { id: "q1", label: "r1", isStart: false, isAccept: false, x: 360, y: 120 },
        { id: "q2", label: "r2", isStart: false, isAccept: false, x: 360, y: 360 },
      ],
      transitions: [
        { id: "1", from: "q0", to: "q0", symbol: "0" },
        { id: "2", from: "q0", to: "q1", symbol: "1" },
        { id: "3", from: "q1", to: "q2", symbol: "0" },
        { id: "4", from: "q1", to: "q0", symbol: "1" },
        { id: "5", from: "q2", to: "q1", symbol: "0" },
        { id: "6", from: "q2", to: "q2", symbol: "1" },
      ],
    },
  },
  {
    id: "nfa-101",
    name: "NFA — contains 101",
    desc: "Nondeterministic, guesses where '101' starts",
    testInput: "0010100",
    machine: {
      type: "NFA",
      states: [
        { id: "q0", label: "q0", isStart: true,  isAccept: false, x: 100, y: 220 },
        { id: "q1", label: "q1", isStart: false, isAccept: false, x: 280, y: 220 },
        { id: "q2", label: "q2", isStart: false, isAccept: false, x: 460, y: 220 },
        { id: "q3", label: "q3", isStart: false, isAccept: true,  x: 640, y: 220 },
      ],
      transitions: [
        { id: "1", from: "q0", to: "q0", symbol: "0" },
        { id: "2", from: "q0", to: "q0", symbol: "1" },
        { id: "3", from: "q0", to: "q1", symbol: "1" },
        { id: "4", from: "q1", to: "q2", symbol: "0" },
        { id: "5", from: "q2", to: "q3", symbol: "1" },
        { id: "6", from: "q3", to: "q3", symbol: "0" },
        { id: "7", from: "q3", to: "q3", symbol: "1" },
      ],
    },
  },
  {
    id: "tm-anbn",
    name: "TM — aⁿbⁿ",
    desc: "Equal a's then equal b's",
    testInput: "aabb",
    machine: {
      type: "TM",
      blank: BLANK,
      states: [
        { id: "q0", label: "q0", isStart: true,  isAccept: false, x: 100, y: 240 },
        { id: "q1", label: "q1", isStart: false, isAccept: false, x: 280, y: 120 },
        { id: "q2", label: "q2", isStart: false, isAccept: false, x: 460, y: 240 },
        { id: "q3", label: "q3", isStart: false, isAccept: false, x: 460, y: 380 },
        { id: "q4", label: "q4", isStart: false, isAccept: true,  x: 700, y: 240 },
      ],
      transitions: [
        // q0: at left end. mark next a as X, or if we already matched everything, verify
        { id: "1", from: "q0", to: "q1", read: "a",   write: "X",   move: "R" },
        { id: "2", from: "q0", to: "q3", read: "Y",   write: "Y",   move: "R" },
        { id: "3", from: "q0", to: "q4", read: BLANK, write: BLANK, move: "S" },

        // q1: scan right past a's and Y's until we find a b, then mark it Y and head left
        { id: "4", from: "q1", to: "q1", read: "a",   write: "a",   move: "R" },
        { id: "5", from: "q1", to: "q1", read: "Y",   write: "Y",   move: "R" },
        { id: "6", from: "q1", to: "q2", read: "b",   write: "Y",   move: "L" },

        // q2: walk back left past Y's and a's until we hit an X, then go right into q0
        { id: "7", from: "q2", to: "q2", read: "Y",   write: "Y",   move: "L" },
        { id: "8", from: "q2", to: "q2", read: "a",   write: "a",   move: "L" },
        { id: "9", from: "q2", to: "q0", read: "X",   write: "X",   move: "R" },

        // q3: verify nothing but Y's remain to the right, then blank → accept
        { id: "10", from: "q3", to: "q3", read: "Y",   write: "Y",   move: "R" },
        { id: "11", from: "q3", to: "q4", read: BLANK, write: BLANK, move: "S" },
      ],
    },
  },
];

// blank machine when you reset
export function blankMachine(mode: "DFA" | "NFA" | "TM"): Machine {
  const q0: any = { id: "q0", label: "q0", isStart: true, isAccept: false, x: 240, y: 240 };
  if (mode === "TM") return { type: "TM", states: [q0], transitions: [], blank: BLANK };
  return { type: mode, states: [q0], transitions: [] };
}