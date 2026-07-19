"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Eye, Trash2, Search, FileText, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCoverLetter } from "@/actions/cover-letter";

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
];

export default function CoverLetterList({ coverLetters }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const searchRef = useRef(null);

  // Keyboard shortcut: press "/" to focus search.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteCoverLetter(id);
      toast.success("Cover letter deleted successfully!");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to delete cover letter");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = (coverLetters ?? []).filter((l) => {
      if (!q) return true;
      return (
        l.companyName?.toLowerCase().includes(q) ||
        l.jobTitle?.toLowerCase().includes(q) ||
        l.jobDescription?.toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "az":
          return String(a.companyName).localeCompare(String(b.companyName));
        case "za":
          return String(b.companyName).localeCompare(String(a.companyName));
        case "newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return list;
  }, [coverLetters, query, sort]);

  if (!coverLetters?.length) {
    return (
      <Card className="glass">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl ring-aurora text-white">
            <FileText className="h-6 w-6" />
          </span>
          <p className="font-medium">No cover letters yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first cover letter to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company, role, or description  ( / )"
            className="pl-9"
            aria-label="Search cover letters"
          />
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-40" aria-label="Sort cover letters">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {coverLetters.length} cover letter{coverLetters.length === 1 ? "" : "s"}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No cover letters match &ldquo;{query}&rdquo;.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((letter, i) => (
            <motion.div
              key={letter.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
            >
            <Card className="glass group relative transition-all duration-300 ease-spring hover:-translate-y-1 hover:border-white/20">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg font-semibold">
                      {letter.jobTitle}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {letter.companyName}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="shrink-0 capitalize">
                    {letter.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                  {letter.jobDescription}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(letter.createdAt), "PPP")}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => router.push(`/ai-cover-letter/${letter.id}`)}
                      aria-label={`View ${letter.jobTitle} at ${letter.companyName}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" aria-label={`Delete ${letter.jobTitle} at ${letter.companyName}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete cover letter?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your cover letter for {letter.jobTitle} at{" "}
                            {letter.companyName}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(letter.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}