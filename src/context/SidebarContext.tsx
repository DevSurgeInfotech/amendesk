'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCollapse: () => void;
  toggleMobileOpen: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('amendesk_sidebar_collapsed');
      if (stored !== null) {
        requestAnimationFrame(() => {
          setCollapsed(stored === 'true');
        });
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleSetCollapsed: React.Dispatch<React.SetStateAction<boolean>> = useCallback((valOrFn) => {
    setCollapsed((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('amendesk_sidebar_collapsed', String(next));
        } catch {
          // Ignore storage errors
        }
      }
      return next;
    });
  }, []);

  const toggleCollapse = useCallback(() => {
    handleSetCollapsed((prev) => !prev);
  }, [handleSetCollapsed]);

  const toggleMobileOpen = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed: handleSetCollapsed,
        mobileOpen,
        setMobileOpen,
        toggleCollapse,
        toggleMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    // Graceful fallback if rendered outside provider
    return {
      collapsed: false,
      setCollapsed: () => {},
      mobileOpen: false,
      setMobileOpen: () => {},
      toggleCollapse: () => {},
      toggleMobileOpen: () => {},
    };
  }
  return context;
}
