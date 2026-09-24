import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const leadership = [
  {
    name: "Dr. K. Cholaraja",
    position: "Assistant Professor",
    role: "Head & Overall Coordinator – SelfE Hackathon",
    phone: "+91 7598290829",
    initials: "KC",
    label: "Faculty",
  },
  {
    name: "Agadeeshwaran D",
    position: "Boys Hostel President",
    role: "Overall Coordinator – SelfE Hackathon",
    phone: "8807557756",
    initials: "AG",
    label: "Student",
  },
];

const mentors = [
  {
    name: "Nandhini S",
    position: "Girls Hostel President",
    role: "Mentor – SelfE Hackathon",
    phone: "+91 9894957734",
    initials: "NS",
  },
  {
    name: "Dinesh Balan",
    position: "Boys Hostel Secretary",
    role: "Mentor – SelfE Hackathon",
    phone: "+91 9629129027",
    initials: "DB",
  },
  {
    name: "Harshikaa S",
    position: "Girls Hostel Secretary",
    role: "Mentor – SelfE Hackathon",
    phone: "+91 7845912127",
    initials: "HS",
  },
];

function MentorCard({
  name,
  position,
  role,
  phone,
  initials,
}: (typeof mentors)[number]) {
  return (
    <article className="group relative overflow-hidden rounded-[1.6rem] border border-indigo-100 bg-indigo-50/45 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:bg-indigo-50/70 hover:shadow-xl">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100" />

      <div className="relative">
        {/* Profile */}
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-black text-indigo-700">
            {initials}
          </div>

          <div className="min-w-0 pt-0.5">
            <h3 className="text-lg font-extrabold tracking-tight text-slate-950">
              {name}
            </h3>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {position}
            </p>
          </div>
        </div>

        {/* Role */}
        <div className="mt-6 rounded-2xl border border-indigo-100/70 bg-white/70 p-4">
          <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-indigo-600">
            Role
          </p>

          <p className="mt-1.5 text-sm font-bold leading-6 text-slate-800">
            {role}
          </p>
        </div>

        {/* Phone - display only */}
        <div className="mt-5 flex items-center gap-2 border-t border-indigo-100/80 pt-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-indigo-500">
            <Phone size={14} />
          </span>

          <span className="text-sm font-semibold text-slate-600">
            {phone}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">

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

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

        </div>
      </header>


      <main>

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden border-b border-slate-200 bg-white">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(99,102,241,.16),transparent_30%),radial-gradient(circle_at_90%_5%,rgba(14,165,233,.11),transparent_28%)]" />

          <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20">

            <div className="max-w-3xl">

              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-indigo-700">
                <Users size={13} />
                SelfE Hackathon
              </div>

              <h1 className="mt-5 text-4xl font-extrabold tracking-[-.045em] text-slate-950 sm:text-6xl">
                Get in touch with{" "}
                <span className="text-indigo-600">
                  the SelfE team.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                For registration, team formation, mentor guidance, or
                hackathon-related coordination, connect with the appropriate
                person below.
              </p>

            </div>

          </div>
        </section>


        {/* =====================================================
            LEADERSHIP
        ===================================================== */}

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">

          <div className="mb-8">

            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-indigo-600">
              Leadership
            </p>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              SelfE Hackathon Leadership
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              For official coordination and event-related assistance,
              connect with the leadership team.
            </p>

          </div>


          <div className="grid gap-5 lg:grid-cols-2">

            {leadership.map((leader) => (

              <article
                key={leader.name}
                className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-7 text-white shadow-xl shadow-slate-950/10 transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >

                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl" />

                <div className="relative">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-950 shadow-lg">
                      {leader.initials}
                    </div>

                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.14em] text-indigo-200">
                      {leader.label}
                    </span>

                  </div>


                  <h3 className="mt-7 text-xl font-extrabold tracking-tight sm:text-2xl">
                    {leader.name}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    {leader.position}
                  </p>


                  {/* Role */}

                  <div className="mt-6 rounded-2xl bg-white/5 p-4">

                    <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-indigo-300">
                      Role
                    </p>

                    <p className="mt-1.5 text-sm font-bold leading-6 text-white">
                      {leader.role}
                    </p>

                  </div>


                  {/* Phone - Display only */}

                  <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-5 text-sm font-semibold text-slate-300">

                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                      <Phone size={14} />
                    </span>

                    {leader.phone}

                  </div>

                </div>

              </article>

            ))}

          </div>


          {/* =================================================
              MENTORS
          ================================================= */}

          <div className="mt-16">

            <div className="mb-8">

              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-indigo-600">
                Mentoring
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Student Mentors
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Reach out to the mentors for hackathon guidance and
                participant support.
              </p>

            </div>


            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {mentors.map((mentor) => (
                <MentorCard
                  key={mentor.name}
                  {...mentor}
                />
              ))}

            </div>

          </div>


          {/* =================================================
              BOTTOM INFORMATION
          ================================================= */}

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Mail size={18} />
              </div>

              <div>

                <p className="text-sm font-extrabold text-slate-900">
                  Need assistance?
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Please contact the appropriate leadership member or mentor
                  based on your query.
                </p>

              </div>

              <div className="sm:ml-auto">

                <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500">
                  <MapPin size={13} />
                  SelfE Hostellers
                </span>

              </div>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">

          <span>
            © 2026 SelfE Hackathon · Exclusive for hostellers
          </span>

          <span className="flex items-center gap-2">
            <ShieldCheck size={14} />
            Official coordination contacts
          </span>

        </div>

      </footer>

    </div>
  );
}