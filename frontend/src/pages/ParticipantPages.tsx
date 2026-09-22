import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Building2, Check, CheckCircle2, Copy, Crown, Mail, Phone, Plus, ShieldCheck, Sparkles, UserRound, Users, UserPlus, UserMinus, X, Pencil } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, PageLoader, SectionHeader, Spinner, StatCard, useToast } from "../components/ui";

const emptyEligibility = { isEligible: false, memberCount: 0, requiredMemberCount: 6, femaleCount: 0, distinctDepartmentCount: 0, requiredDistinctDepartments: 3, reasons: ["Create or join a team to begin eligibility checks."], departments: [] as string[] };

function normalizeTeam(response: any) {
  if (response && Object.prototype.hasOwnProperty.call(response, "team")) return response.team ?? null;
  return response ?? null;
}

export function ParticipantDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState<any | null | undefined>(undefined);
  const [error, setError] = useState("");
  const load = async () => { setError(""); try { const r = await api<any>("/teams/me"); setTeam(normalizeTeam(r)); } catch (e) { setTeam(null); setError(e instanceof Error ? e.message : "Unable to load your team"); } };
  useEffect(() => { load(); }, []);
  if (team === undefined) return <PageLoader/>;
  const first = user?.studentProfile?.fullName?.split(" ")[0] ?? "there";
  return <div className="space-y-6">
    <SectionHeader eyebrow="Participant workspace" title={`Welcome back, ${first}.`} description="Build your team, track eligibility and see mentor allocation from one place." action={<Badge tone="info"><Sparkles size={12}/>Team formation phase</Badge>}/>
    {error && <ErrorState message={error} onRetry={load}/>}
    {team ? <TeamOverview team={team}/> : <NoTeamDashboard/>}
  </div>;
}

export function TeamAccessPage({ initialMode = "create" }: { initialMode?: "create" | "join" }) {
  const [createdTeam, setCreatedTeam] = useState<any | null>(null);
  if (createdTeam) return <div className="space-y-6"><SectionHeader eyebrow="Team workspace" title="Your team is ready" description="Your team has been created. Add members using the team code shown below."/><TeamOverview team={createdTeam}/></div>;
  return <TeamSetup initialMode={initialMode} onCreated={setCreatedTeam}/>;
}


function NoTeamDashboard() {
  return <div className="space-y-6">
    <Card className="overflow-hidden border-indigo-100 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
        <div>
          <Badge tone="info"><Users size={12}/>Team formation is open</Badge>
          <h2 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Start with your six-member hackathon team.</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">Create a new team if you are leading it, or join an existing team using its invite code. Your eligibility is checked automatically as members join.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/app/create-team" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-100"><Plus size={16}/>Create team</Link>
            <Link to="/app/join-team" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15"><UserPlus size={16}/>Join team</Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <RuleChip title="6" text="Members"/>
          <RuleChip title="1+" text="Female"/>
          <RuleChip title="3+" text="Departments"/>
        </div>
      </div>
    </Card>
    <div className="grid gap-4 md:grid-cols-2">
      <Link to="/app/create-team" className="group">
        <Card className="h-full p-6 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
          <div className="flex items-start justify-between gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Plus size={20}/></div><ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600"/></div>
          <h3 className="mt-5 text-lg font-extrabold">Create a new team</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">Choose a team name and become the team leader. You can then share the generated code with your teammates.</p>
        </Card>
      </Link>
      <Link to="/app/join-team" className="group">
        <Card className="h-full p-6 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
          <div className="flex items-start justify-between gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><UserPlus size={20}/></div><ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600"/></div>
          <h3 className="mt-5 text-lg font-extrabold">Join an existing team</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">Enter the six-character team code shared by your team leader. A student can belong to only one team.</p>
        </Card>
      </Link>
    </div>
    <Card className="p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Eligibility rules</p><h3 className="mt-1 text-lg font-extrabold">Your team becomes eligible when all three checks pass.</h3></div>
        <Badge tone="warning">Not started</Badge>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3"><RuleRow icon={Users} title="Exactly 6 members"/><RuleRow icon={UserRound} title="At least 1 female member"/><RuleRow icon={Building2} title="At least 3 departments"/></div>
    </Card>
  </div>;
}

function RuleRow({ icon: Icon, title }: { icon: typeof Users; title: string }) { return <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm"><Icon size={16}/></div><span className="text-sm font-semibold text-slate-700">{title}</span></div>; }

function TeamSetup({ onCreated, initialMode = "create" }: { onCreated: (team: any) => void; initialMode?: "create" | "join" }) {
  const [mode, setMode] = useState<"create" | "join">(initialMode);
  const [name, setName] = useState(""); const [code, setCode] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const toast = useToast();
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); setBusy(true); try { const team = await api<any>(mode === "create" ? "/teams" : "/teams/join", { method: "POST", body: mode === "create" ? { name: name.trim() } : { teamCode: code.trim().toUpperCase() } }); onCreated(team); toast.toast(mode === "create" ? "Team created successfully" : "You joined the team successfully"); } catch (e) { setError(e instanceof Error ? e.message : "Request failed"); } finally { setBusy(false); } }
  return <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
    <Card className="overflow-hidden bg-slate-950 text-white"><div className="p-7 sm:p-9"><Badge tone="info">Next step</Badge><h2 className="mt-5 max-w-lg text-3xl font-extrabold tracking-[-.03em]">Build the six-person team that will carry your idea forward.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">Create your team if you are leading, or use a teammate's code to join an existing team.</p><div className="mt-8 grid gap-3 sm:grid-cols-3"><RuleChip title="6" text="Members"/><RuleChip title="1+" text="Female member"/><RuleChip title="3+" text="Departments"/></div></div></Card>
    <Card className="p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-indigo-600">Team access</p><h2 className="mt-1 text-xl font-extrabold">{mode === "create" ? "Create a team" : "Join a team"}</h2></div><div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === "create" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`} onClick={() => setMode("create")}>Create</button><button className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === "join" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`} onClick={() => setMode("join")}>Join</button></div></div>{error && <div className="mt-5"><ErrorState message={error}/></div>}<form className="mt-7 space-y-5" onSubmit={submit}>{mode === "create" ? <Field label="Team name" hint="Use a clear name your mentor can identify."><Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Byte Builders"/></Field> : <Field label="Team code" hint="Ask your team leader for the six-character code."><Input required value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} className="font-mono uppercase tracking-[.22em]" placeholder="ABC123"/></Field>}<Button size="lg" disabled={busy} className="w-full">{busy ? <><Spinner/>Working…</> : mode === "create" ? <><Plus size={17}/>Create team</> : <><UserPlus size={17}/>Join team</>}</Button></form></Card>
  </div>;
}
function RuleChip({ title, text }: { title: string; text: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><p className="text-2xl font-extrabold">{title}</p><p className="mt-1 text-xs text-slate-400">{text}</p></div>; }

function TeamOverview({ team }: { team: any }) {
  const { user } = useAuth();
  const e = team.eligibility ?? emptyEligibility;
  const toast = useToast();
  const [members, setMembers] = useState<any[]>(team.members ?? []);
  const [busyMember, setBusyMember] = useState<string | null>(null);
  const [error, setError] = useState("");
  const copy = async () => { try { await navigator.clipboard.writeText(team.teamCode); toast.toast("Team code copied"); } catch { toast.toast("Copy is not available in this browser", "error"); } };
  const mentor = team.mentor;
  const [contactOpen, setContactOpen] = useState(false);
  const isLeader = Boolean(user?.studentProfile?.teamMembership?.isLeader) || user?.role === "TEAM_LEADER";
  async function removeMember(studentId: string, name: string) {
    if (!isLeader) return;
    if (!window.confirm(`Remove ${name} from ${team.name}? They can then join another team.`)) return;
    setBusyMember(studentId); setError("");
    try {
      await api(`/teams/${team.id}/members/${studentId}`, { method: "DELETE" });
      toast.toast(`${name} was removed from the team`);
      window.location.reload();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not remove team member"); }
    finally { setBusyMember(null); }
  }
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Team members" value={`${team.memberCount ?? e.memberCount}/6`} sub="Exact size required" icon={Users} tone={team.memberCount === 6 ? "emerald" : "amber"}/><StatCard label="Female members" value={team.femaleCount ?? e.femaleCount} sub="At least 1 required" icon={UserRound} tone={(team.femaleCount ?? 0) > 0 ? "emerald" : "rose"}/><StatCard label="Departments" value={team.departmentCount ?? e.distinctDepartmentCount} sub="At least 3 required" icon={Building2} tone={(team.departmentCount ?? 0) >= 3 ? "emerald" : "amber"}/><StatCard label="Mentor" value={mentor ? "Assigned" : "Pending"} sub={mentor?.fullName ?? "Waiting for admin allocation"} icon={ShieldCheck} tone={mentor ? "indigo" : "amber"}/></div>
    <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <Card className="overflow-hidden"><div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-extrabold">{team.name}</h2><Badge tone={e.isEligible ? "success" : "warning"}>{e.isEligible ? "Eligible" : team.status === "FORMING" ? "Forming" : "Needs action"}</Badge></div><p className="mt-1.5 text-sm text-slate-500">Team code <span className="ml-1 rounded-lg bg-slate-100 px-2 py-1 font-mono font-bold tracking-widest text-slate-800">{team.teamCode}</span></p></div><Button size="sm" variant="outline" onClick={copy}><Copy size={14}/>Copy code</Button></div>
        {error && <div className="border-b border-rose-100 bg-rose-50 px-6 py-3 text-sm font-semibold text-rose-700">{error}</div>}
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50"><tr><th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">Member</th><th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">Department</th><th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">Role</th><th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">Gender</th>{isLeader && <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">Manage</th>}</tr></thead><tbody className="divide-y divide-slate-100">{members.map((m: any) => <tr key={m.id}><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-xs font-black text-indigo-700">{m.fullName?.slice(0,1)}</div><div><p className="text-sm font-bold text-slate-900">{m.fullName}</p><p className="text-xs text-slate-400">{m.registerNumber}</p></div></div></td><td className="px-6 py-4 text-sm text-slate-600">{m.department}</td><td className="px-6 py-4">{m.isLeader ? <Badge tone="info"><Crown size={11}/>Leader</Badge> : <span className="text-sm text-slate-500">Member</span>}</td><td className="px-6 py-4 text-sm text-slate-500">{String(m.gender).replaceAll("_", " ")}</td>{isLeader && <td className="px-6 py-4 text-right">{!m.isLeader && <Button size="sm" variant="ghost" disabled={busyMember === m.studentId} onClick={() => removeMember(m.studentId, m.fullName)} title="Remove member"><UserMinus size={15} className="text-rose-500"/>Remove</Button>}</td>}</tr>)}{!members.length && <tr><td colSpan={isLeader ? 5 : 4}><EmptyState title="No members yet"/></td></tr>}</tbody></table></div>
        {isLeader && <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs text-slate-500"><UserMinus size={14} className="text-rose-500"/>As team leader, you can remove non-leader members so they can join another team.</div>}
      </Card>
      <Card className="p-6"><div className="flex items-start justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-400">Eligibility</p><h3 className="mt-1 text-lg font-extrabold">Team checks</h3></div>{e.isEligible ? <CheckCircle2 className="text-emerald-500"/> : <AlertTriangle className="text-amber-500"/>}</div><div className="mt-6 space-y-3"><CheckRow label="Members" value={`${e.memberCount}/${e.requiredMemberCount}`} pass={e.memberCount === e.requiredMemberCount}/><CheckRow label="Female member" value={`${e.femaleCount}`} pass={e.femaleCount >= 1}/><CheckRow label="Departments" value={`${e.distinctDepartmentCount}/${e.requiredDistinctDepartments}`} pass={e.distinctDepartmentCount >= e.requiredDistinctDepartments}/></div>{!e.isEligible && <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-xs leading-6 text-amber-800"><p className="font-bold">What needs attention</p>{(e.reasons ?? []).map((r: string) => <p key={r}>• {r}</p>)}</div>}{mentor && <div className="mt-6 border-t border-slate-100 pt-5"><p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-400">Guidance mentor</p><p className="mt-2 font-bold">{mentor.fullName}</p><p className="mt-1 text-xs text-slate-500">{mentor.specialization || "Hackathon mentor"}</p><button type="button" className="mt-3 flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700" onClick={() => setContactOpen(true)}><Mail size={13}/>Contact mentor</button></div>}</Card>
    </div>
    {contactOpen && mentor && <MentorContactModal mentor={mentor} onClose={() => setContactOpen(false)}/>}
  </div>;
}
function MentorContactModal({ mentor, onClose }: { mentor: any; onClose: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between bg-slate-950 p-6 text-white"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-indigo-300">Guidance mentor</p><h2 className="mt-2 text-xl font-extrabold">{mentor.fullName}</h2><p className="mt-1 text-sm text-slate-400">{mentor.specialization || "Hackathon mentor"}</p></div><button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10"><X size={18}/></button></div><div className="space-y-3 p-6"><div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"><Phone size={18} className="text-indigo-600"/><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Phone</p><a href={`tel:${mentor.phone}`} className="mt-1 block text-sm font-bold text-slate-900">{mentor.phone || "Not provided"}</a></div></div><div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"><Mail size={18} className="text-indigo-600"/><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Email</p><a href={`mailto:${mentor.email}`} className="mt-1 block break-all text-sm font-bold text-slate-900">{mentor.email}</a></div></div><button onClick={onClose} className="mt-2 w-full rounded-xl bg-slate-950 py-3 text-sm font-bold text-white hover:bg-slate-800">Close</button></div></div></div>;
}
function CheckRow({ label, value, pass }: { label: string; value: any; pass: boolean }) { return <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"><div className={pass ? "text-emerald-500" : "text-amber-500"}>{pass ? <CheckCircle2 size={17}/> : <AlertTriangle size={17}/>}</div><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="text-sm font-extrabold text-slate-900">{value}</p></div><span className={pass ? "text-[10px] font-extrabold text-emerald-600" : "text-[10px] font-extrabold text-amber-600"}>{pass ? "PASS" : "ACTION"}</span></div>; }

export function TeamPage() { const [team, setTeam] = useState<any | null | undefined>(undefined); const [error, setError] = useState(""); const load = async () => { try { const r = await api<any>("/teams/me"); setTeam(normalizeTeam(r)); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load team"); setTeam(null); } }; useEffect(() => { load(); }, []); if (team === undefined) return <PageLoader/>; if (!team) return <div className="space-y-6"><SectionHeader eyebrow="Team" title="My team" description="You are not part of a team yet."/><TeamSetup onCreated={setTeam}/></div>; return <div><SectionHeader eyebrow="Team" title="My team" description="Your current membership, eligibility and mentor status."/><TeamOverview team={team}/></div>; }

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const p: any = user?.studentProfile ?? user?.mentorProfile;
  const isMentor = user?.role === "MENTOR";
  const isAdmin = user?.role === "ADMIN";
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(p?.fullName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  useEffect(() => setName(p?.fullName ?? ""), [p?.fullName]);
  async function saveName(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!name.trim()) { setError("Name is required"); return; }
    setBusy(true);
    try { await api("/students/me", { method: "PATCH", body: { fullName: name.trim() } }); await refresh(); setEditingName(false); toast.toast("Name updated successfully"); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update name"); }
    finally { setBusy(false); }
  }
  return <div>
    <SectionHeader eyebrow="Account" title="Profile" description={isMentor ? "Your mentor account, specialization and guidance profile." : isAdmin ? "Your SelfE Hackathon administrator account." : "Your registered student account and academic information."}/>
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <Card className="overflow-hidden">
        <div className="bg-slate-950 p-7 text-white"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-lg font-black">{(p?.fullName ?? user?.email ?? "U").slice(0,1).toUpperCase()}</div><div className="min-w-0"><h2 className="truncate text-xl font-extrabold">{p?.fullName ?? "Administrator"}</h2><p className="mt-1 truncate text-sm text-slate-400">{user?.email}</p></div></div></div>
        <div className="p-6"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">Access role</p><div className="mt-2 flex items-center justify-between gap-3"><p className="text-sm font-bold">{user?.role?.replaceAll("_", " ")}</p><Badge tone={user?.isActive ? "success" : "danger"}>{user?.isActive ? "Active account" : "Inactive account"}</Badge></div></div>
      </Card>
      <Card className="p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="font-extrabold">Account details</h2><p className="mt-1 text-sm text-slate-500">Only your display name can be edited. Academic and account identity fields remain controlled.</p></div>{!isMentor && !isAdmin && <Button size="sm" variant="outline" onClick={() => setEditingName(v => !v)}><Pencil size={14}/>Edit name</Button>}</div>
        {error && <div className="mt-4"><ErrorState message={error}/></div>}
        {editingName && !isMentor && !isAdmin && <form onSubmit={saveName} className="mt-5 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><Field label="Full name"><Input required value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"/></Field></div><Button disabled={busy}>{busy ? <><Spinner/>Saving…</> : "Save name"}</Button></form>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="Email" value={user?.email}/><Info label="Role" value={user?.role?.replaceAll("_", " ")}/>{p?.registerNumber && <Info label="Register number" value={p.registerNumber}/>} {p?.phone && <Info label="Phone" value={p.phone}/>} {p?.department && <Info label="Department" value={p.department?.name ?? p.department}/>} {p?.year && <Info label="Year" value={p.year}/>} {p?.college && <Info label="College" value={p.college}/>} {p?.specialization && <Info label="Specialization" value={p.specialization}/>}</div>
      </Card>
    </div>
  </div>;
}
function Info({ label, value }: { label: string; value: any }) { return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-[10px] font-extrabold uppercase tracking-[.11em] text-slate-400">{label}</p><p className="mt-1.5 text-sm font-semibold text-slate-800">{value ?? "—"}</p></div>; }
