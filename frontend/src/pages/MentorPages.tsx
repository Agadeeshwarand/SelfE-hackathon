import { useEffect, useState } from "react";
import type { ElementType } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Mail, Phone, ShieldCheck, UsersRound, UserRound, X, ExternalLink } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Badge, Button, Card, EmptyState, ErrorState, PageLoader, SectionHeader, Spinner, StatCard } from "../components/ui";

export function MentorDashboard() {
  const [data, setData] = useState<any>(null); const [error, setError] = useState("");
  const load = async () => { setError(""); try { setData(await api<any>("/mentor/dashboard")); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load mentor dashboard"); } };
  useEffect(() => { load(); }, []);
  if (!data) return <div className="min-h-[420px] flex items-center justify-center">{error ? <ErrorState message={error} onRetry={load}/> : <Spinner label="Loading mentor workspace…"/>}</div>;
  const m = data.mentor; const teams = data.teams ?? [];
  return <div className="space-y-6"><SectionHeader eyebrow="Mentor workspace" title={`Good to see you, ${m.fullName?.split(" ")[0] ?? "mentor"}.`} description="Review your guidance load, assigned teams and team readiness." action={<Badge tone={m.atCapacity ? "warning" : "success"}>{m.atCapacity ? "At capacity" : "Accepting teams"}</Badge>}/><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Assigned teams" value={`${m.assignedTeamCount}/${m.maxTeams}`} sub="Current guidance load" icon={UsersRound}/><StatCard label="Open capacity" value={m.availableCapacity} sub="Teams you can receive" icon={CheckCircle2} tone="emerald"/><StatCard label="Recommended minimum" value={m.minTeams} sub={m.belowRecommended ? "Below target" : "Within target"} icon={UserRound} tone={m.belowRecommended ? "amber" : "sky"}/></div><div className="grid gap-6 xl:grid-cols-[1fr_.38fr]"><Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="font-extrabold">Assigned teams</h2><p className="mt-1 text-xs text-slate-500">Teams currently allocated to your guidance queue.</p></div><span className="text-xs font-bold text-slate-400">{teams.length} total</span></div>{teams.length ? <div className="grid gap-4 p-5 md:grid-cols-2">{teams.map((t: any) => <TeamCard key={t.id} team={t}/>)}</div> : <EmptyState title="No teams assigned" description="An administrator will assign eligible teams from the mentor allocation workspace."/>}</Card><Card className="p-6"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Your profile</p><h2 className="mt-1 text-lg font-extrabold">Mentor details</h2><div className="mt-5 space-y-3"><Info icon={Mail} label="Email" value={m.email}/><Info icon={Phone} label="Phone" value={m.phone}/><Info icon={ShieldCheck} label="Specialization" value={m.specialization || "General mentor"}/></div><div className="mt-6 rounded-2xl bg-slate-50 p-4"><div className="flex justify-between text-xs font-bold"><span>Capacity used</span><span>{m.assignedTeamCount}/{m.maxTeams}</span></div><div className="mt-3 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${m.maxTeams ? Math.min(100, m.assignedTeamCount / m.maxTeams * 100) : 0}%` }}/></div></div></Card></div></div>;
}


function StudentContactModal({
  student,
  onClose,
}: {
  student: any;
  onClose: () => void;
}) {
  const initials = (student.fullName ?? "Student")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/50 bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-slate-950 px-6 pb-7 pt-6 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close contact details"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4 pr-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-black ring-1 ring-white/15">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-extrabold tracking-tight">{student.fullName}</p>
              <p className="mt-1 text-xs text-white/60">{student.registerNumber}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/80">
              {student.department}
            </span>
            {student.isLeader && (
              <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-[11px] font-bold text-emerald-200">
                Team leader
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3 p-6">
          <ContactRow icon={Mail} label="Email" value={student.email} href={student.email ? `mailto:${student.email}` : undefined} />
          <ContactRow icon={Phone} label="Phone" value={student.phone} href={student.phone ? `tel:${student.phone}` : undefined} />

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            {student.phone && (
              <a
                href={`tel:${student.phone}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-700"
              >
                <Phone size={16} />
                Call student
              </a>
            )}
            {student.email && (
              <a
                href={`mailto:${student.email}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
              >
                <Mail size={16} />
                Send email
              </a>
            )}
          </div>

          {!student.phone && !student.email && (
            <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              Contact information is not available for this student.
            </div>
          )}

          <p className="pt-2 text-center text-[11px] leading-5 text-slate-400">
            Contact details are visible because this student belongs to your assigned guidance team.
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: ElementType;
  label: string;
  value: any;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p>
        <p className="mt-1 break-all text-sm font-bold text-slate-800">{value || "Not available"}</p>
      </div>
      {href && <ExternalLink size={15} className="shrink-0 text-slate-400" />}
    </div>
  );

  return href ? <a href={href}>{content}</a> : content;
}

export function MentorTeamsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setData(await api<any>("/mentor/dashboard"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load teams");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!data) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <Spinner label="Loading teams…" />
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Guidance"
        title="Assigned teams"
        description="Review team readiness and securely contact students from the teams assigned to you."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {(data.teams ?? []).map((team: any) => (
          <TeamCard key={team.id} team={team} detailed />
        ))}
        {!(data.teams ?? []).length && (
          <Card className="lg:col-span-2">
            <EmptyState title="No teams assigned yet" description="An administrator will assign eligible teams to your guidance queue." />
          </Card>
        )}
      </div>
    </div>
  );
}

export function MentorTeamDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [contactStudent, setContactStudent] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    api<any>(`/teams/${id}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load team"));
  }, [id]);

  if (error) {
    return (
      <div>
        <SectionHeader eyebrow="Guidance" title="Team details" />
        <ErrorState message={error} />
      </div>
    );
  }

  if (!data) return <PageLoader />;

  const e = data.eligibility;

  return (
    <>
      <div>
        <SectionHeader
          eyebrow="Guidance"
          title={data.name}
          description={`${data.teamCode} · ${data.memberCount}/6 members`}
          action={
            <Button variant="outline" onClick={() => navigate("/mentor/teams")}>
              Back to teams
            </Button>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <h2 className="font-extrabold">Team members</h2>
                <Badge tone={data.isEligible ? "success" : "warning"}>
                  {data.isEligible ? "Eligible" : "Needs action"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Contact and academic details for the assigned team.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {(data.members ?? []).map((m: any) => (
                <div key={m.id} className="flex items-center gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-700">
                    {m.fullName?.slice(0, 1)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{m.fullName}</p>
                      {m.isLeader && <Badge tone="neutral">Leader</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {m.registerNumber} · {m.email}
                    </p>
                  </div>

                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-bold">{m.department}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {m.phone || "No phone"}
                    </p>
                  </div>

                  <button
                    onClick={() => setContactStudent(m)}
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-extrabold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <Phone size={14} />
                    Contact
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-400">
              Readiness
            </p>
            <h2 className="mt-1 text-lg font-extrabold">Eligibility checks</h2>

            <div className="mt-5 space-y-3">
              <Check label="Members" value={`${e.memberCount}/6`} ok={e.memberCount === 6} />
              <Check label="Female member" value={e.femaleCount} ok={e.femaleCount >= 1} />
              <Check label="Departments" value={`${e.distinctDepartmentCount}/3`} ok={e.distinctDepartmentCount >= 3} />
            </div>

            {!e.isEligible && (
              <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-xs leading-6 text-amber-800">
                <p className="font-bold">Needs attention</p>
                {(e.reasons ?? []).map((r: string) => (
                  <p key={r}>• {r}</p>
                ))}
              </div>
            )}

            {data.mentor && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-400">
                  Guidance mentor
                </p>
                <p className="mt-2 font-bold">{data.mentor.fullName}</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {contactStudent && (
        <StudentContactModal
          student={contactStudent}
          onClose={() => setContactStudent(null)}
        />
      )}
    </>
  );
}

function TeamCard({ team, detailed = false }: { team: any; detailed?: boolean }) {
  const e = team.eligibility ?? {};
  const navigate = useNavigate();
  const [contactStudent, setContactStudent] = useState<any>(null);

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-extrabold">{team.name}</h3>
              <Badge tone={e.isEligible ? "success" : "warning"}>
                {e.isEligible ? "Eligible" : "Needs action"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">{team.teamCode} · {team.memberCount}/6 members</p>
          </div>
          <button
            onClick={() => navigate(`/mentor/teams/${team.id}`)}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-50"
            aria-label={`Open ${team.name}`}
          >
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Check label="Members" value={`${e.memberCount}/6`} ok={e.memberCount === 6} />
          <Check label="Female" value={e.femaleCount} ok={e.femaleCount >= 1} />
          <Check label="Departments" value={e.distinctDepartmentCount} ok={e.distinctDepartmentCount >= 3} />
        </div>

        {detailed && (
          <div className="mt-5 border-t border-slate-100 pt-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">Team members</p>
              <span className="text-[10px] font-bold text-slate-400">{(team.members ?? []).length} students</span>
            </div>

            <div className="divide-y divide-slate-100">
              {(team.members ?? []).map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-700">
                    {m.fullName?.slice(0, 1)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-800">{m.fullName}</p>
                      {m.isLeader && <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-amber-700">Leader</span>}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">{m.registerNumber} · {m.department}</p>
                  </div>

                  <button
                    onClick={() => setContactStudent(m)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-2.5 py-2 text-[11px] font-extrabold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <Phone size={13} />
                    Contact
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate(`/mentor/teams/${team.id}`)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50"
            >
              View complete team details
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {!e.isEligible && (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            <AlertTriangle className="mr-1 inline" size={13} />
            {(e.reasons ?? []).join(" ")}
          </div>
        )}
      </Card>

      {contactStudent && (
        <StudentContactModal
          student={contactStudent}
          onClose={() => setContactStudent(null)}
        />
      )}
    </>
  );
}

function Check({ label, value, ok }: { label: string; value: any; ok: boolean }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 text-sm font-extrabold">{value}</p><p className={ok ? "text-[10px] font-bold text-emerald-600" : "text-[10px] font-bold text-amber-600"}>{ok ? "PASS" : "ACTION"}</p></div>; }
function Info({ icon: Icon, label, value }: { icon: ElementType; label: string; value: any }) { return <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"><Icon size={16} className="text-indigo-600"/><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-semibold text-slate-700">{value || "—"}</p></div></div>; }
