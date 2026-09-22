import React from "react";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("HackForge frontend runtime error:", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white p-7 shadow-2xl sm:p-9">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-sm font-black text-rose-600">
            !
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-rose-600">
            Application error
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
            This page could not be loaded.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            The server is still running, but the frontend hit an unexpected rendering error.
            Refresh once. If it happens again, the technical detail below identifies the exact issue.
          </p>
          <details className="mt-6 rounded-2xl bg-slate-50 p-4">
            <summary className="cursor-pointer text-xs font-bold text-slate-700">Technical detail</summary>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-rose-700">
              {this.state.error.stack || this.state.error.message}
            </pre>
          </details>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              Reload application
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Sign in again
            </button>
          </div>
        </div>
      </div>
    );
  }
}
