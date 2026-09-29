import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Save,
  Send,
  UsersRound,
  XCircle,
} from "lucide-react";
import { api } from "../lib/api";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  SectionHeader,
  Spinner,
  StatCard,
} from "../components/ui";

export default function MentorAttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionName, setSessionName] = useState("Mentor Guidance Session");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setError("");
    try {
      const result = await api<any>(
        `/attendance/mentor?date=${encodeURIComponent(date)}&sessionName=${encodeURIComponent(sessionName)}`
      );
      setData(result);
      setDirty(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load attendance");
    }
  };

  useEffect(() => {
    load();
  }, [date, sessionName]);

  const locked = data?.session?.status === "SUBMITTED";

  const updateStatus = (
    studentId: string,
    status: "PRESENT" | "ABSENT"
  ) => {
    if (locked) return;

    setData((previous: any) => ({
      ...previous,
      teams: (previous?.teams ?? []).map((team: any) => ({
        ...team,
        members: team.members.map((member: any) =>
          member.studentId === studentId
            ? { ...member, status }
            : member
        ),
      })),
    }));

    setDirty(true);
  };

  const records = useMemo(
    () =>
      (data?.teams ?? []).flatMap((team: any) =>
        (team.members ?? [])
          .filter((member: any) => Boolean(member.status))
          .map((member: any) => ({
            studentId: member.studentId,
            teamId: member.teamId,
            status: member.status,
          }))
      ),
    [data]
  );

  const summary = useMemo(() => {
    const members = (data?.teams ?? []).flatMap(
      (team: any) => team.members ?? []
    );
    return {
      total: members.length,
      present: members.filter((m: any) => m.status === "PRESENT").length,
      absent: members.filter((m: any) => m.status === "ABSENT").length,
      unmarked: members.filter((m: any) => !m.status).length,
    };
  }, [data]);

  const saveDraft = async () => {
    setSaving(true);
    setError("");
    try {
      const result = await api<any>("/attendance/mentor", {
        method: "POST",
        body: { date, sessionName, records },
      });
      setData(result);
      setDirty(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!summary.total) {
      setError("No assigned students are available.");
      return;
    }
    if (summary.unmarked > 0) {
      setError(
        `Mark all ${summary.unmarked} unmarked student(s) before submitting.`
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let session = data?.session;

      if (!session || dirty) {
        const saved = await api<any>("/attendance/mentor", {
          method: "POST",
          body: { date, sessionName, records },
        });
        setData(saved);
        setDirty(false);
        session = saved.session;
      }

      const submitted = await api<any>(
        `/attendance/mentor/${session.id}/submit`,
        { method: "POST" }
      );

      setData((previous: any) => ({
        ...previous,
        session: submitted,
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <Spinner label="Loading attendance…" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Mentor workspace"
        title="Attendance"
        description="Mark attendance for students in your assigned guidance teams and submit the completed session to the coordinator."
        action={
          <Badge tone={locked ? "success" : "warning"}>
            {locked ? "Submitted" : "Draft"}
          </Badge>
        }
      />

      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[180px_1fr_auto] lg:items-end">
          <label>
            <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
              Attendance date
            </span>
            <input
              type="date"
              value={date}
              disabled={locked}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>

          <label>
            <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
              Session name
            </span>
            <input
              value={sessionName}
              disabled={locked}
              onChange={(event) => setSessionName(event.target.value)}
              placeholder="Mentor Guidance Session"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>

          <Button
            variant="outline"
            onClick={load}
            disabled={saving || submitting}
          >
            <CalendarCheck size={15} />
            Refresh
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Students" value={summary.total} sub="Assigned to you" icon={UsersRound} />
        <StatCard label="Present" value={summary.present} sub="Marked present" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Absent" value={summary.absent} sub="Marked absent" icon={XCircle} tone="amber" />
        <StatCard
          label="Unmarked"
          value={summary.unmarked}
          sub={summary.unmarked ? "Action required" : "All marked"}
          icon={CalendarCheck}
          tone={summary.unmarked ? "amber" : "sky"}
        />
      </div>

      {error && <ErrorState message={error} />}

      <div className="space-y-5">
        {(data.teams ?? []).map((team: any) => (
          <Card key={team.id} className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold">{team.name}</h2>
                  <Badge tone="neutral">{team.teamCode}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {team.members.length} students · {team.present} present · {team.absent} absent
                </p>
              </div>
              <div className="text-xs font-bold text-slate-400">
                {team.unmarked ? `${team.unmarked} unmarked` : "Complete"}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {team.members.map((member: any) => (
                <div
                  key={member.studentId}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-700">
                    {member.fullName?.slice(0, 1)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900">{member.fullName}</p>
                      {member.isLeader && <Badge tone="neutral">Leader</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {member.registerNumber} · {member.department}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:w-[230px]">
                    <button
                      disabled={locked}
                      onClick={() => updateStatus(member.studentId, "PRESENT")}
                      className={`rounded-xl px-3 py-2.5 text-xs font-extrabold transition ${
                        member.status === "PRESENT"
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-200 bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      <CheckCircle2 size={14} className="mr-1 inline" />
                      Present
                    </button>

                    <button
                      disabled={locked}
                      onClick={() => updateStatus(member.studentId, "ABSENT")}
                      className={`rounded-xl px-3 py-2.5 text-xs font-extrabold transition ${
                        member.status === "ABSENT"
                          ? "bg-rose-600 text-white"
                          : "border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                      }`}
                    >
                      <XCircle size={14} className="mr-1 inline" />
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        {!(data.teams ?? []).length && (
          <Card>
            <EmptyState
              title="No teams assigned"
              description="Attendance becomes available after an administrator assigns guidance teams to you."
            />
          </Card>
        )}
      </div>

      <Card className="sticky bottom-4 border-indigo-100 bg-white/95 p-4 shadow-xl backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-extrabold">
              {locked ? "Attendance submitted" : "Ready to submit?"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {locked
                ? "This attendance session is locked after submission."
                : "Save a draft anytime. Submit only after every student is marked."}
            </p>
          </div>

          {!locked && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={saving || submitting || summary.total === 0}
              >
                <Save size={15} />
                {saving ? "Saving…" : "Save draft"}
              </Button>

              <Button
                onClick={submit}
                disabled={
                  saving ||
                  submitting ||
                  summary.unmarked > 0 ||
                  summary.total === 0
                }
              >
                <Send size={15} />
                {submitting ? "Submitting…" : "Submit to Coordinator"}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
