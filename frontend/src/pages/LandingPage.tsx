import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Users,
  Handshake,
  Download,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useState } from "react";

const flow = [
  [
    "01",
    "Register",
    "Create your student account once and keep your details in one secure workspace.",
  ],
  [
    "02",
    "Build your team",
    "Create a team or join a teammate using a six-character team code.",
  ],
  [
    "03",
    "Meet the rules",
    "The platform checks six members, one female member and three departments.",
  ],
  [
    "04",
    "Get your mentor",
    "Eligible teams are allocated to a guidance mentor by the organizers.",
  ],
];

export default function LandingPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">

          {/* Logo */}

          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
              S
            </span>

            <span>
              <b className="block text-sm tracking-tight">
                SelfE Hackathon
              </b>

              <small className="block text-[9px] font-bold uppercase tracking-[.2em] text-slate-400">
                Hostellers Edition · 2026
              </small>
            </span>
          </Link>


          {/* Desktop Navigation */}

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">

            <a
              href="#experience"
              className="hover:text-slate-950"
            >
              Experience
            </a>

            <a
              href="#flow"
              className="hover:text-slate-950"
            >
              How it works
            </a>

            <a
              href="#rules"
              className="hover:text-slate-950"
            >
              Team rules
            </a>

          </nav>


          {/* Desktop Actions */}

          <div className="hidden items-center gap-3 md:flex">

            <Link
              to="/contact"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Contact
            </Link>

            <Link
              to="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800"
            >
              Register{" "}
              <ArrowRight
                className="ml-1 inline"
                size={15}
              />
            </Link>

          </div>


          {/* Mobile Menu Button */}

          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl p-2 text-slate-600 md:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X /> : <Menu />}
          </button>

        </div>


        {/* Mobile Menu */}

        {open && (
          <div className="border-t border-slate-100 bg-white px-5 py-4 md:hidden">

            <div className="flex flex-col gap-2 text-sm font-semibold">

              <a
                href="#experience"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-slate-50"
              >
                Experience
              </a>

              <a
                href="#flow"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-slate-50"
              >
                How it works
              </a>

              <a
                href="#rules"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-slate-50"
              >
                Team rules
              </a>

              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-slate-50"
              >
                Contact
              </Link>

              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-slate-50"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-slate-950 px-3 py-3 text-white"
              >
                Register
              </Link>

            </div>

          </div>
        )}

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>

        {/* Hero */}

        <section className="relative overflow-hidden border-b border-slate-200">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(99,102,241,.14),transparent_32%),radial-gradient(circle_at_90%_0%,rgba(14,165,233,.10),transparent_28%)]" />

          <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-28 lg:pt-24">

            <div>

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-indigo-700 shadow-sm">
                <Sparkles size={13} />
                Exclusive for hostellers
              </div>

              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-slate-400">
                SelfE Hackathon · 2026
              </p>

              <h1 className="mt-4 max-w-4xl text-5xl font-extrabold tracking-[-.055em] text-slate-950 sm:text-6xl lg:text-7xl">
                Build together.
                <br />
                <span className="text-indigo-600">
                  Ship something real.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-slate-500 sm:text-lg">
                A dedicated hackathon workspace for SelfE hostellers — from
                student registration and six-member teams to eligibility
                checks and mentor guidance.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">

                <Link
                  to="/register"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-xl shadow-slate-950/10 hover:bg-slate-800"
                >
                  Create your account
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex h-12 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Open participant access
                </Link>

              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-500">

                <span className="flex items-center gap-2">
                  <CheckCircle2
                    size={15}
                    className="text-emerald-500"
                  />
                  Server-side eligibility
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2
                    size={15}
                    className="text-emerald-500"
                  />
                  Mentor guidance
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2
                    size={15}
                    className="text-emerald-500"
                  />
                  Organizer exports
                </span>

              </div>

            </div>


            {/* Hero Preview */}

            <div className="relative">

              <div className="absolute -inset-10 rounded-[4rem] bg-indigo-100/50 blur-3xl" />

              <div className="relative rounded-[2rem] border border-slate-200 bg-slate-950 p-4 shadow-2xl shadow-slate-950/20">

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[.05] p-5 sm:p-6">

                  <div className="flex items-center justify-between border-b border-white/10 pb-5">

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
                        SelfE Hackathon workspace
                      </p>

                      <p className="mt-1 text-sm font-bold text-white">
                        Hosteller operations
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                      READY
                    </span>

                  </div>

                  <div className="grid grid-cols-2 gap-3 py-5">

                    <Metric
                      label="Teams"
                      value="6 members"
                    />

                    <Metric
                      label="Mentors"
                      value="Guidance"
                    />

                    <Metric
                      label="Eligibility"
                      value="Live checks"
                    />

                    <Metric
                      label="Exports"
                      value="XLSX + CSV"
                    />

                  </div>

                  <div className="space-y-2">

                    {flow.map(([n, title]) => (
                      <div
                        key={n}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] p-3.5"
                      >

                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[10px] font-bold text-white">
                          {n}
                        </span>

                        <span className="text-xs font-semibold text-slate-200">
                          {title}
                        </span>

                        <CheckCircle2
                          size={15}
                          className="ml-auto text-emerald-400"
                        />

                      </div>
                    ))}

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* Experience */}

        <section
          id="experience"
          className="border-b border-slate-200 bg-white"
        >

          <div className="mx-auto grid max-w-7xl gap-5 px-5 py-20 sm:px-8 md:grid-cols-3">

            <Feature
              icon={Users}
              title="Build the right team"
              text="Create or join a six-member team, share a simple team code and see every member in one place."
            />

            <Feature
              icon={Handshake}
              title="Get guided"
              text="Once your team is eligible, organizers can allocate one guidance mentor with controlled capacity."
            />

            <Feature
              icon={Download}
              title="Keep operations clean"
              text="Organizers can download live student, team, member and mentor-allocation data as XLSX or CSV."
            />

          </div>

        </section>


        {/* Flow */}

        <section
          id="flow"
          className="mx-auto max-w-7xl px-5 py-24 sm:px-8"
        >

          <div className="max-w-2xl">

            <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">
              The participant journey
            </p>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Simple for students. Clear for organizers.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              Every important step has a clear state, so teams know what to do
              next and organizers always have the operational picture.
            </p>

          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {flow.map(([n, title, text]) => (
              <div
                key={n}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >

                <span className="text-xs font-bold text-indigo-600">
                  {n}
                </span>

                <h3 className="mt-5 font-bold text-slate-950">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {text}
                </p>

              </div>
            ))}

          </div>

        </section>


        {/* Rules */}

        <section
          id="rules"
          className="bg-slate-950 text-white"
        >

          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">

            <div>

              <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-300">
                Team formation
              </p>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Eligibility is checked for you.
              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-400">
                SelfE Hackathon uses server-side rules so the team status
                shown to students and organizers stays consistent.
              </p>

            </div>

            <div className="grid gap-3 sm:grid-cols-2">

              <Rule
                title="Exactly 6 members"
                text="A team is complete only when six registered students are members."
              />

              <Rule
                title="At least 1 female member"
                text="The team must include at least one female member."
              />

              <Rule
                title="At least 3 departments"
                text="Members must represent at least three distinct departments."
              />

              <Rule
                title="One team per student"
                text="A registered student can belong to only one team at a time."
              />

            </div>

          </div>

        </section>


        {/* CTA */}

        <section className="border-b border-slate-200 bg-white">

          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">
                Ready when you are
              </p>

              <h2 className="mt-2 text-2xl font-extrabold">
                Your next step is to create your participant account.
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Registration takes one pass. Team formation happens inside
                the workspace.
              </p>

            </div>

            <Link
              to="/register"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800"
            >
              Register for SelfE Hackathon
              <ArrowRight size={16} />
            </Link>

          </div>

        </section>

      </main>


      {/* Footer */}

      <footer className="bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">

          <span>
            © 2026 SelfE Hackathon · Exclusive for hostellers
          </span>

          <span className="flex items-center gap-2">
            <ShieldCheck size={14} />
            Secure role-based access
          </span>

        </div>

      </footer>

    </div>
  );
}


/* ============================================================
   SMALL COMPONENTS
============================================================ */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.04] p-4">

      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-white">
        {value}
      </p>

    </div>
  );
}


function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
        <Icon size={19} />
      </div>

      <h3 className="mt-5 font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {text}
      </p>

    </div>
  );
}


function Rule({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5">

      <p className="font-bold">
        {title}
      </p>

      <p className="mt-1 text-sm leading-6 text-slate-400">
        {text}
      </p>

    </div>
  );
}