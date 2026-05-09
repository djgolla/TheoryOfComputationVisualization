import { HashRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Sim from "./pages/Sim";
import About from "./pages/About";

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <Routes>
          <Route path="/"      element={<Home />} />
          <Route path="/sim"   element={<Sim />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

function Nav() {
  const link = ({ isActive }: { isActive: boolean }) =>
    `hover:text-indigo-600 ${isActive ? "text-indigo-600 font-medium" : ""}`;

  return (
    <nav className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-6 text-sm">
      <Link to="/" className="font-bold text-lg">Theory Of Computation Visualization</Link>
      <div className="flex gap-4">
        <NavLink to="/sim"   className={link}>Simulator</NavLink>
        <NavLink to="/about" className={link}>About</NavLink>
      </div>
      <div className="ml-auto text-xs text-neutral-500">
        IT 328 Honors · Daniel Golladay
      </div>
    </nav>
  );
}