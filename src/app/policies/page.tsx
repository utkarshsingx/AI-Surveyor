"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Loader2,
  Trash2,
  Calendar,
  Building2,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchPolicies, createPolicy, deletePolicy } from "@/lib/api-client";
import type { Policy } from "@/types";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("policy");
  const [formDepartment, setFormDepartment] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formOwner, setFormOwner] = useState("");

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const data = await fetchPolicies();
      setPolicies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setCreating(true);
    try {
      await createPolicy({
        name: formName,
        category: formCategory as Policy["category"],
        department: formDepartment,
        description: formDescription,
        owner: formOwner,
      });
      setShowCreate(false);
      setFormName("");
      setFormDepartment("");
      setFormDescription("");
      setFormOwner("");
      await loadPolicies();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePolicy(id);
      setPolicies((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = policies.filter((p) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusCounts = {
    active: policies.filter((p) => p.status === "active").length,
    draft: policies.filter((p) => p.status === "draft").length,
    expired: policies.filter((p) => p.status === "expired").length,
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Policies & Documents</h1>
          <p className="text-sm text-muted-foreground">
            Manage organizational policies, procedures, and guidelines linked to accreditation standards.
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Policy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Policy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Policy Name</label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Hand Hygiene Policy" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="guideline">Guideline</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Department</label>
                <Input value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} placeholder="e.g. Infection Control" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Owner</label>
                <Input value={formOwner} onChange={(e) => setFormOwner(e.target.value)} placeholder="e.g. IPC Department" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !formName.trim()}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{statusCounts.active}</p>
              <p className="text-xs text-muted-foreground">Active Policies</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <FileText className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.draft}</p>
              <p className="text-xs text-muted-foreground">Draft Policies</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Calendar className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{statusCounts.expired}</p>
              <p className="text-xs text-muted-foreground">Expired / Review Due</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search policies..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="policy">Policy</SelectItem>
            <SelectItem value="procedure">Procedure</SelectItem>
            <SelectItem value="guideline">Guideline</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Policy List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Policies ({filtered.length})</CardTitle>
        </CardHeader>
        <ScrollArea className="h-[500px]">
          <CardContent>
            <div className="space-y-3">
              {filtered.map((pol) => (
                <div key={pol.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{pol.name}</p>
                        {pol.code && <span className="text-xs text-muted-foreground">({pol.code})</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{pol.description}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {pol.department}
                        </span>
                        <span>v{pol.version}</span>
                        {pol.review_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Review: {pol.review_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={pol.category === "policy" ? "default" : "secondary"} className="text-xs">
                      {pol.category}
                    </Badge>
                    <Badge variant={pol.status === "active" ? "success" : pol.status === "draft" ? "warning" : "destructive"} className="text-xs">
                      {pol.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(pol.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No policies found.</p>
              )}
            </div>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
