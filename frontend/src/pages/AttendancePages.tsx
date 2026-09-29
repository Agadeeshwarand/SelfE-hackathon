import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { api, downloadFile } from "../lib/api";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  SectionHeader,
  Spinner,
  StatCard,
  useToast,
} from "../components/ui";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function AdminAttendancePage() {
  const [date, setDate] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [status, setStatus] = useState("ALL");
  const [items, setItems] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (mentorId) params.set("mentorId", mentorId);
      if (status !== "ALL") params.set("status", status);

      const result = await api<any>(
        `/attendance/admin${params.toString() ? `?${params.toString()}` : ""}`
      );

      setItems(result.items ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load attendance"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [date, mentorId, status]);

  useEffect(() => {
    api<any>("/mentors?status=ACTIVE&page=1&pageSize=100")
      .then((result) => setMentors(result.items ?? []))
      .catch(() => setMentors([]));
  }, []);

  const totals = useMemo(
    () => ({
      sessions: items.length,
      submitted: items.filter((item) => item.status === "SUBMITTED").length,
      present: items.reduce(
        (total, item) => total + Number(item.summary?.present ?? 0),
        0
      ),
      absent: items.reduce(
        (total, item) => total + Number(item.summary?.absent ?? 0),
        0
      ),
    }),
    [items]
  );

  const downloadAttendance = async (format: "xlsx" | "csv") => {
    try {
      const params = new URLSearchParams();
      params.set("format", format);
      if (date) params.set("date", date);
      if (mentorId) params.set("mentorId", mentorId);
      if (status !== "ALL") params.set("status", status);

      await downloadFile(`/exports/attendance?${params.toString()}`);
      toast.toast("Attendance export downloaded successfully");
    } catch (error) {
      toast.toast(
        error instanceof Error ? error.message : "Attendance export failed",
        "error"
      );
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Data operations"
        title="Attendance"
        description="Review mentor-submitted attendance for assigned teams and download the attendance register."
        action={
          <Button variant="outline" onClick={load}>
            <RefreshCw size={15} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sessions"
          value={totals.sessions}
          sub="Attendance sessions"
          icon={CalendarCheck}
        />
        <StatCard
          label="Submitted"
          value={totals.submitted}
          sub="Locked sessions"
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Present"
          value={totals.present}
          sub="Across visible sessions"
          icon={UsersRound}
          tone="sky"
        />
        <StatCard
          label="Absent"
          value={totals.absent}
          sub="Across visible sessions"
          icon={XCircle}
          tone="amber"
        />
      </div>

      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[180px_1fr_180px_auto] lg:items-end">
          <label>
            <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>

          <label>
            <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
              Mentor
            </span>
            <select
              value={mentorId}
              onChange={(event) => setMentorId(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="">All mentors</option>
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.fullName}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
              Status
            </span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="ALL">All</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DRAFT">Draft</option>
            </select>
          </label>

          <Button
            variant="outline"
            onClick={() => {
              setDate("");
              setMentorId("");
              setStatus("ALL");
            }}
          >
            Clear
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-extrabold">Attendance register</h2>
            <p className="mt-1 text-xs text-slate-500">
              Attendance submitted by mentors for their assigned teams.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => downloadAttendance("xlsx")}>
              <FileSpreadsheet size={14} />
              Excel .xlsx
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadAttendance("csv")}
            >
              <FileText size={14} />
              CSV
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <Spinner label="Loading attendance…" />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead>
                <tr>
                  {["Date", "Session", "Mentor", "Students", "Attendance", "Status", "Action"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="bg-slate-50 px-4 py-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="border-t border-slate-100 px-4 py-4 font-semibold">
                      {formatDate(item.attendanceDate)}
                    </td>
                    <td className="border-t border-slate-100 px-4 py-4">
                      <p className="font-bold">{item.sessionName}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {item.submittedAt
                          ? new Date(item.submittedAt).toLocaleString()
                          : "Not submitted"}
                      </p>
                    </td>
                    <td className="border-t border-slate-100 px-4 py-4 font-semibold">
                      {item.mentor.fullName}
                    </td>
                    <td className="border-t border-slate-100 px-4 py-4">
                      {item.summary.total}
                    </td>
                    <td className="border-t border-slate-100 px-4 py-4">
                      <span className="font-bold text-emerald-600">
                        {item.summary.present} P
                      </span>
                      <span className="mx-2 text-slate-300">·</span>
                      <span className="font-bold text-rose-600">
                        {item.summary.absent} A
                      </span>
                    </td>
                    <td className="border-t border-slate-100 px-4 py-4">
                      <Badge tone={item.status === "SUBMITTED" ? "success" : "warning"}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="border-t border-slate-100 px-4 py-4">
                      <Button size="sm" variant="outline" onClick={() => setSelected(item)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              title="No attendance sessions"
              description="Mentors will appear here after saving or submitting attendance."
            />
          </div>
        )}
      </Card>

      {selected && (
        <AttendanceDetailModal
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function AttendanceDetailModal({
  item,
  onClose,
}: {
  item: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-indigo-600">
              Attendance details
            </p>
            <h2 className="mt-1 text-xl font-extrabold">
              {item.mentor.fullName} · {item.sessionName}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {formatDate(item.attendanceDate)} · {item.summary.total} students
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-auto p-5">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr>
                {["Team", "Student", "Register No", "Department", "Phone", "Status"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="bg-slate-50 px-4 py-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400"
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {item.records.map((record: any) => (
                <tr key={record.id}>
                  <td className="border-t border-slate-100 px-4 py-3 font-semibold">
                    {record.team.name}
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3 font-bold">
                    {record.student.fullName}
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3 text-slate-500">
                    {record.student.registerNumber}
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3 text-slate-500">
                    {record.student.department}
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3 text-slate-500">
                    {record.student.phone}
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3">
                    <Badge
                      tone={record.status === "PRESENT" ? "success" : "warning"}
                    >
                      {record.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
