import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const { authUser, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Investment Plans', path: '/plans' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Contact', path: '/contact' },
  ];

  const go = (path: string) => {
    setMobileOpen(false);
    onNavigate(path);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#061121]/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Clean single-line brand mark */}
        <BrandLogo onClick={() => go('/')} />

        {/* Zone 2: Concise single-line text nav links */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = currentPath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => go(item.path)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-[21px] h-0.5 bg-emerald-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Account / Primary CTA */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {authUser ? (
            <>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => go('/admin')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    currentPath.startsWith('/admin')
                      ? 'text-emerald-300 bg-emerald-500/10'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Admin
                </button>
              )}
              <button
                type="button"
                onClick={() => go('/dashboard')}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => void logout().then(() => go('/'))}
                className="rounded-lg border border-white/15 px-3.5 py-2 text-sm font-medium text-slate-200 hover:border-white/30 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => go('/login')}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 hover:border-white/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => go('/register')}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Register
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="lg:hidden inline-flex items-center justify-center rounded-lg border border-white/15 p-2 text-slate-200 hover:text-white cursor-pointer"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#081529] px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => go(item.path)}
              className={`block w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer ${
                currentPath === item.path
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-slate-200 hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-3 mt-2 border-t border-white/10 flex flex-col gap-2">
            {authUser ? (
              <>
                <button
                  type="button"
                  onClick={() => go('/dashboard')}
                  className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 cursor-pointer"
                >
                  Open Dashboard
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => go('/admin')}
                    className="w-full rounded-lg border border-emerald-500/40 px-4 py-2.5 text-sm font-semibold text-emerald-300 cursor-pointer"
                  >
                    Admin Console
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void logout().then(() => go('/'))}
                  className="w-full rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-100 cursor-pointer"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => go('/register')}
                  className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
