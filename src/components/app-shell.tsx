"use client";

import {
  BriefcaseBusiness,
  CircleUserRound,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ProjectSummary, WorkspaceData } from "@/lib/types";

type AppShellProps = {
  data: WorkspaceData;
  children: React.ReactNode;
  currentProject?: ProjectSummary;
  demoMode?: boolean;
  onSignOut?: () => void;
};

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return <span className="avatar">{initials}</span>;
}

export function AppShell({
  data,
  children,
  currentProject,
  demoMode = false,
  onSignOut,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="app-layout">
      <button
        type="button"
        aria-label={sidebarOpen ? "ปิดเมนู" : "เปิดเมนู"}
        className={`sidebar-backdrop ${sidebarOpen ? "is-visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="brand-row">
          <Link href="/" className="brand-link" onClick={() => setSidebarOpen(false)}>
            <span className="brand-mark" aria-hidden="true">⌁</span>
            <span>
              <strong>Orange Cat</strong>
              <small>Team Workspace</small>
            </span>
          </Link>
          <button
            className="icon-button sidebar-close"
            type="button"
            aria-label="ปิดเมนู"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <button className="workspace-switcher" type="button">
          <span className="status-dot" />
          <span>{data.workspace.name}</span>
          <ChevronDown size={16} />
        </button>

        <nav className="sidebar-nav" aria-label="เมนูหลัก">
          <p className="nav-label">เมนูหลัก</p>
          <Link
            href="/"
            className={`nav-item ${pathname === "/" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutGrid size={18} /> ภาพรวมโปรเจกต์
          </Link>
          <Link
            href="/members"
            className={`nav-item ${pathname === "/members" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users size={18} /> สมาชิกทีม
          </Link>
          <Link
            href="/profile"
            className={`nav-item ${pathname === "/profile" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <CircleUserRound size={18} /> โปรไฟล์ของฉัน
          </Link>
          <span className="nav-item disabled" aria-disabled="true">
            <Settings size={18} /> ตั้งค่าเวิร์กสเปซ
          </span>

          <div className="nav-section-heading">
            <p className="nav-label">โปรเจกต์</p>
            {data.workspace.role === "admin" && (
              <Link href="/projects/new" className="mini-action" aria-label="เพิ่มโปรเจกต์">
                <Plus size={16} /> เพิ่ม
              </Link>
            )}
          </div>

          <div className="project-nav-list">
            {data.projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={`project-nav-item ${currentProject?.id === project.id ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="project-dot" style={{ background: project.color ?? "#64748B" }} />
                <span>{project.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="account-row">
          <Initials name={data.user.displayName} />
          <Link href="/profile" className="account-copy" onClick={() => setSidebarOpen(false)}>
            <strong>{data.user.displayName}</strong>
            <small>{data.workspace.role}</small>
          </Link>
          {onSignOut && (
            <form action={onSignOut}>
              <button className="icon-button" type="submit" aria-label="ออกจากระบบ">
                <LogOut size={18} />
              </button>
            </form>
          )}
        </div>
      </aside>

      <div className="content-column">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            type="button"
            aria-label="เปิดเมนู"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="topbar-title">
            <span className="project-dot" style={{ background: currentProject?.color ?? "#0B63F6" }} />
            <strong>{currentProject?.name ?? data.workspace.name}</strong>
          </div>
          <div className="topbar-actions">
            <button className="topbar-search" type="button">
              <Search size={18} />
              <span>ค้นหางานหรือผู้รับผิดชอบ</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="role-pill"><ShieldCheck size={15} /> {data.workspace.role}</span>
            {data.workspace.role === "admin" && (
              <Link href="/projects/new" className="primary-button compact">
                <Plus size={18} /> เพิ่มโปรเจกต์
              </Link>
            )}
          </div>
        </header>

        {demoMode && (
          <div className="demo-banner">
            <BriefcaseBusiness size={16} />
            <span>โหมดตัวอย่าง — เชื่อม Supabase เพื่อเปิดใช้ข้อมูลจริงและระบบสิทธิ์</span>
            <Link href="/setup">ดูวิธีเชื่อมต่อ</Link>
          </div>
        )}

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
