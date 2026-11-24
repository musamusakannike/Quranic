import React from "react";
import { NavLink, useLocation } from "react-router";
import {
  Home,
  BookOpen,
  Bookmark,
  Headphones,
  Clock,
  Compass,
  Sparkles,
  CalendarDays,
  Layers,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { Kbd } from "../ui";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommandPalette: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onOpenCommandPalette,
}) => {
  const { dict } = useI18n();
  const location = useLocation();

  const items = [
    { to: "/", label: dict.nav.home, icon: Home, match: (p: string) => p === "/" },
    {
      to: "/quran",
      label: dict.nav.quran,
      icon: BookOpen,
      match: (p: string) => p.startsWith("/quran"),
    },
    {
      to: "/bookmarks",
      label: dict.nav.bookmarks,
      icon: Bookmark,
      match: (p: string) => p.startsWith("/bookmarks"),
    },
    {
      to: "/audio",
      label: dict.nav.audio,
      icon: Headphones,
      match: (p: string) => p.startsWith("/audio"),
    },
    {
      to: "/prayer-times",
      label: dict.nav.prayerTimes,
      icon: Clock,
      match: (p: string) => p.startsWith("/prayer-times"),
    },
    {
      to: "/qiblah",
      label: dict.nav.qiblah,
      icon: Compass,
      match: (p: string) => p.startsWith("/qiblah"),
    },
    {
      to: "/adhkaar",
      label: dict.nav.adhkaar,
      icon: Sparkles,
      match: (p: string) => p.startsWith("/adhkaar"),
    },
    {
      to: "/hijri",
      label: dict.nav.hijri,
      icon: CalendarDays,
      match: (p: string) => p.startsWith("/hijri"),
    },
    {
      to: "/hifz",
      label: dict.nav.hifz,
      icon: Layers,
      match: (p: string) => p.startsWith("/hifz"),
    },
  ];

  const isSettingsActive =
    location.pathname.startsWith("/settings") || location.pathname.startsWith("/about");

  return (
    <aside
      aria-label="Primary navigation"
      className="flex h-full shrink-0 flex-col border-e border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200 ease-out"
      style={{
        width: collapsed ? "var(--sidebar-rail-width)" : "var(--sidebar-width)",
      }}
    >
      {/* Brand + Collapse */}
      <div className="flex h-14 items-center justify-between px-3.5 border-b border-[var(--color-border)]">
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[var(--color-primary)] text-white text-[14px] font-bold">
              ق
            </span>
            <span className="truncate text-[15px] font-bold tracking-tight text-[var(--color-text)]">
              {dict.app.name}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? dict.nav.expandSidebar : dict.nav.collapseSidebar}
          title={collapsed ? dict.nav.expandSidebar : dict.nav.collapseSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] cursor-pointer mx-auto data-[expanded=true]:mx-0"
          data-expanded={!collapsed}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} strokeWidth={1.75} />
          ) : (
            <PanelLeftClose size={18} strokeWidth={1.75} />
          )}
        </button>
      </div>

      {/* Command Palette Trigger */}
      <div className="p-2.5">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          aria-label={dict.nav.searchHint}
          title={dict.nav.searchHint}
          className={`flex h-9 w-full items-center rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer ${
            collapsed ? "justify-center px-0" : "justify-between px-2.5"
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Search size={15} strokeWidth={1.75} className="shrink-0" />
            {!collapsed && <span className="truncate">{dict.nav.searchHint}</span>}
          </span>
          {!collapsed && <Kbd>⌘K</Kbd>}
        </button>
      </div>

      {/* Main Nav Links */}
      <nav className="flex-1 overflow-y-auto py-1">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.match(location.pathname);
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  aria-label={item.label}
                  title={collapsed ? item.label : undefined}
                  className={`relative flex h-9 items-center gap-3 px-3.5 text-[14px] transition-colors duration-150 ${
                    collapsed ? "justify-center px-0" : ""
                  } ${
                    active
                      ? "font-semibold text-[var(--color-primary)]"
                      : "font-normal text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1.5 start-0 w-[2px] bg-[var(--color-primary)]"
                    />
                  )}
                  <Icon size={18} strokeWidth={1.75} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Settings */}
      <div className="border-t border-[var(--color-border)] py-2">
        <NavLink
          to="/settings"
          aria-label={dict.nav.settings}
          title={collapsed ? dict.nav.settings : undefined}
          className={`relative flex h-9 items-center gap-3 px-3.5 text-[14px] transition-colors duration-150 ${
            collapsed ? "justify-center px-0" : ""
          } ${
            isSettingsActive
              ? "font-semibold text-[var(--color-primary)]"
              : "font-normal text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          }`}
        >
          {isSettingsActive && (
            <span
              aria-hidden="true"
              className="absolute inset-y-1.5 start-0 w-[2px] bg-[var(--color-primary)]"
            />
          )}
          <Settings size={18} strokeWidth={1.75} className="shrink-0" />
          {!collapsed && <span className="truncate">{dict.nav.settings}</span>}
        </NavLink>
      </div>
    </aside>
  );
};
