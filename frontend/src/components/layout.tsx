import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, Download, Handshake, LayoutDashboard, LogOut, Menu, UserRound, Users, UsersRound, X, Plus, UserPlus, Megaphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { cn } from "./ui";

const adminNav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/teams", label: "Teams", icon: UsersRound },
  { to: "/admin/mentors", label: "Mentors", icon: UserRound },
  { to: "/admin/mentor-allocation", label: "Mentor allocation", icon: Handshake },
  { to: "/admin/messages", label: "Student messages", icon: Megaphone },
  { to: "/admin/exports", label: "Export center", icon: Download },
];
const mentorNav = [
  { to: "/mentor", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/mentor/teams", label: "Assigned teams", icon: UsersRound },
  { to: "/mentor/profile", label: "Profile", icon: UserRound },
];
const participantNav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/create-team", label: "Create team", icon: Plus },
  { to: "/app/join-team", label: "Join team", icon: UserPlus },
  { to: "/app/team", label: "My team", icon: UsersRound },
  { to: "/app/profile", label: "Profile", icon: UserRound },
];

function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const r = await api<any>("/notifications"); setItems(r.items ?? []); } catch { setItems([]); } finally { setLoading(false); }
  };
  useEffect(() => { if (user) load(); }, [user]);
  useEffect(() => { if (open && user) load(); }, [open]);
  if (!user) return null;
  return <div className="relative">
    <button aria-label="Notifications" onClick={() => setOpen(v => !v)} className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100">
      <Bell size={18}/>{items.length > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-600"/>}
    </button>
    {open && <>
      <button className="fixed inset-0 z-40 cursor-default" aria-label="Close notifications" onClick={() => setOpen(false)}/>
      <div className="absolute right-0 z-50 mt-2 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-indigo-600">Updates</p><h3 className="mt-1 text-sm font-extrabold">Hackathon messages</h3></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{items.length}</span></div>
        <div className="max-h-[420px] overflow-y-auto">
          {loading ? <div className="p-6 text-sm text-slate-500">Loading messages…</div> : items.length ? items.map((item: any) => <article key={item.id} className="border-b border-slate-100 p-5 last:border-0"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Megaphone size={16}/></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-bold text-slate-900">{item.title}</h4><span className={cn("rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase", item.priority === "URGENT" ? "bg-rose-50 text-rose-600" : item.priority === "HIGH" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500")}>{item.priority ?? "NORMAL"}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-500">{item.description}</p><p className="mt-2 text-[10px] font-semibold text-slate-400">{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : new Date(item.createdAt).toLocaleString()}</p></div></div></article>) : <div className="p-8 text-center"><Bell className="mx-auto text-slate-300" size={24}/><p className="mt-3 text-sm font-bold text-slate-700">No messages yet</p><p className="mt-1 text-xs leading-5 text-slate-400">Organizer updates will appear here.</p></div>}
        </div>
      </div>
    </>}
  </div>;
}

export function AppShell() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const nav = user?.role === "ADMIN" ? adminNav : user?.role === "MENTOR" ? mentorNav : participantNav;
  const current = useMemo(() => nav.find(item => location.pathname === item.to || (!item.end && location.pathname.startsWith(`${item.to}/`))), [location.pathname, nav]);
  const display = user?.studentProfile?.fullName ?? user?.mentorProfile?.fullName ?? "Administrator";
  const roleLabel = user?.role === "ADMIN" ? "Administrator" : user?.role === "MENTOR" ? "Mentor" : "Participant";

  return <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
    {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}/>} 
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">S</span><span><span className="block text-sm font-extrabold tracking-tight">SelfE Hackathon</span><span className="block text-[9px] font-bold uppercase tracking-[.2em] text-slate-400">Hostellers Edition</span></span></button>
        <button className="rounded-lg p-2 text-slate-400 lg:hidden" onClick={() => setMobileOpen(false)}><X size={18}/></button>
      </div>
      <div className="px-4 pt-6"><p className="px-3 pb-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">{roleLabel} workspace</p><nav className="space-y-1">{nav.map(item => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)} className={({isActive}) => cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", isActive ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950")}><item.icon size={17}/><span className="flex-1">{item.label}</span><ChevronRight size={14} className="opacity-0 transition group-[.active]:opacity-60"/></NavLink>)}</nav></div>
      <div className="mt-auto border-t border-slate-100 p-4"><div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">{display.slice(0,1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-xs font-bold">{display}</p><p className="truncate text-[11px] text-slate-500">{user?.email}</p></div></div><button onClick={() => { logout(); navigate("/login"); }} className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600"><LogOut size={15}/>Sign out</button></div>
    </aside>
    <div className="lg:pl-[272px]">
      <header className="sticky top-0 z-30 flex h-[76px] items-center border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7"><button onClick={() => setMobileOpen(true)} className="mr-3 rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu size={20}/></button><div className="flex min-w-0 flex-1 items-center gap-2"><span className="hidden text-xs font-semibold text-slate-400 sm:block">SelfE Hackathon</span><ChevronRight size={13} className="hidden text-slate-300 sm:block"/><span className="truncate text-sm font-bold">{current?.label ?? "Workspace"}</span></div><NotificationBell/></header>
      <main className="mx-auto max-w-[1540px] p-4 sm:p-7 lg:p-9"><Outlet/></main>
    </div>
  </div>;
}
