import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { homeForRole } from "../lib/api";
import {
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  Select,
  Spinner,
} from "../components/ui";

const DEPARTMENTS = [
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "Mechanical",
  "AI & DS",
  "CCE",
  "AMIL",
  "CSBS",
  "CYBERSECURITY",
];

const DEFAULT_COLLEGE = "Sri Eshwar College Of Engineering";

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    registerNumber: "",
    email: "",
    phone: "",
    gender: "FEMALE",
    department: "CSE",
    year: 1,
    college: DEFAULT_COLLEGE,
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  const set = (key: keyof typeof form, value: any) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      const user = await register({
        ...form,
        year: 1,
        college: DEFAULT_COLLEGE,
      });

      nav(homeForRole(user.role));
    } catch (x) {
      setError(
        x instanceof Error ? x.message : "Registration failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 font-extrabold text-white">
              H
            </span>

            <span className="font-extrabold">
              SelfE Hackathon
            </span>
          </Link>

          <Link
            to="/login"
            className="text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            Already registered? Sign in
          </Link>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">
              Student registration
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Create your SelfE Hackathon account.
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Register once. Then create a team or join an existing
              team using its code.
            </p>
          </div>

          <Card className="p-6 sm:p-8">
            <form
              onSubmit={submit}
              className="space-y-7"
            >
              {error && <ErrorState message={error} />}

              <div>
                <h2 className="font-bold text-slate-950">
                  Personal details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Use the same academic information used by your
                  institution.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name">
                  <Input
                    required
                    value={form.fullName}
                    onChange={(e) =>
                      set("fullName", e.target.value)
                    }
                    placeholder="Your full name"
                  />
                </Field>

                <Field label="Register number">
                  <Input
                    required
                    value={form.registerNumber}
                    onChange={(e) =>
                      set("registerNumber", e.target.value)
                    }
                    placeholder="e.g. 23CS001"
                  />
                </Field>

                <Field label="Email">
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      set("email", e.target.value)
                    }
                    placeholder="student@example.com"
                  />
                </Field>

                <Field label="Phone">
                  <Input
                    required
                    value={form.phone}
                    onChange={(e) =>
                      set("phone", e.target.value)
                    }
                    placeholder="10-digit phone number"
                  />
                </Field>

                <Field label="Gender">
                  <Select
                    required
                    value={form.gender}
                    onChange={(e) =>
                      set("gender", e.target.value)
                    }
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">
                      Prefer not to say
                    </option>
                  </Select>
                </Field>

                <Field label="Department">
                  <Select
                    required
                    value={form.department}
                    onChange={(e) =>
                      set("department", e.target.value)
                    }
                  >
                    {DEPARTMENTS.map((department) => (
                      <option
                        key={department}
                        value={department}
                      >
                        {department}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Year">
                  <Input
                    value="1 Year"
                    readOnly
                    className="bg-slate-100 text-slate-600"
                  />
                </Field>

                <Field label="College">
                  <Input
                    value={DEFAULT_COLLEGE}
                    readOnly
                    className="bg-slate-100 text-slate-600"
                  />
                </Field>
              </div>

              <div className="border-t border-slate-100 pt-7">
                <Field label="Password">
                  <Input
                    type="password"
                    minLength={8}
                    required
                    value={form.password}
                    onChange={(e) =>
                      set("password", e.target.value)
                    }
                    placeholder="At least 8 characters"
                  />
                </Field>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2
                    className="mt-0.5 text-emerald-500"
                    size={18}
                  />

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Team rules are enforced automatically
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Teams must have exactly 6 members, at least
                      1 female member and at least 3 distinct
                      departments. A student can only belong to one
                      team.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner />
                    Creating account
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}