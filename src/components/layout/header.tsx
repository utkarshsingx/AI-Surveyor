"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Search, User, X, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchGlobal, fetchNotifications, markNotificationsRead } from "@/lib/api-client";
import { useAccreditation } from "@/contexts/accreditation-context";
import Link from "next/link";

export function Header() {
  const {
    accreditations,
    facilities,
    selectedAccreditation,
    selectedFacility,
    setSelectedAccreditation,
    setSelectedFacility,
  } = useAccreditation();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: string; id: string; title: string; subtitle: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; type: string; read: boolean; created_at: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications().then(setNotifications).catch(console.error);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      setShowSearch(true);
      try {
        const data = await searchGlobal(searchQuery);
        setSearchResults(data.results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getSearchLink = (result: { type: string; id: string }) => {
    switch (result.type) {
      case "accreditation": return `/accreditations/${result.id}`;
      case "evidence": return "/evidence";
      case "project": return "/survey";
      case "standard": return "/accreditations";
      case "me": return "/gap-analysis";
      default: return "/";
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4">
      {/* Left: Logo area + title */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a5276]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-700">Demo Main</span>
      </div>

      {/* Center: Search */}
      <div className="flex items-center gap-3" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search standards, evidence..."
            className="w-[280px] pl-10 h-9 text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowSearch(true)}
          />
          {searchQuery && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => { setSearchQuery(""); setShowSearch(false); }}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {showSearch && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border bg-white shadow-lg">
              {searching ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <ScrollArea className="max-h-[300px]">
                  <div className="p-2">
                    {searchResults.map(result => (
                      <Link
                        key={`${result.type}-${result.id}`}
                        href={getSearchLink(result)}
                        onClick={() => setShowSearch(false)}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <Badge variant="outline" className="text-[10px] shrink-0">{result.type}</Badge>
                        <div className="flex-1 truncate">
                          <p className="font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">No results found</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Library + Facility selectors, notifications, language, user */}
      <div className="flex items-center gap-3">
        {/* Library (Accreditation) Selector */}
        <select
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-[#1a5276] focus:ring-1 focus:ring-[#1a5276]"
          value={selectedAccreditation?.id || ""}
          onChange={e => {
            const acc = accreditations.find(a => a.id === e.target.value);
            setSelectedAccreditation(acc || null);
          }}
        >
          {accreditations.map(a => (
            <option key={a.id} value={a.id}>{a.code}</option>
          ))}
        </select>

        {/* Facility Selector */}
        <select
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-[#1a5276] focus:ring-1 focus:ring-[#1a5276]"
          value={selectedFacility?.id || ""}
          onChange={e => {
            const fac = facilities.find(f => f.id === e.target.value);
            setSelectedFacility(fac || null);
          }}
        >
          {facilities.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[9px]" variant="destructive">
                {unreadCount}
              </Badge>
            )}
          </Button>
          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-white shadow-lg">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button className="text-xs text-primary hover:underline" onClick={handleMarkAllRead}>Mark all read</button>
                )}
              </div>
              <ScrollArea className="max-h-[300px]">
                <div className="p-2">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
                      onClick={() => handleMarkRead(n.id)}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        <div className="flex-1">
                          <p className="font-medium">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.message}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="p-4 text-center text-xs text-muted-foreground">No notifications</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Language */}
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-sm text-gray-600">
          <Globe className="h-3.5 w-3.5" />
          English
        </Button>

        {/* User */}
        <div className="flex items-center gap-2.5 border-l pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a5276] text-white">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-xs font-semibold text-[#1a5276]">Welcome ! Super Client Admin</span>
            <span className="text-[10px] text-muted-foreground">demo.admin@accrepro.com</span>
          </div>
        </div>
      </div>
    </header>
  );
}
