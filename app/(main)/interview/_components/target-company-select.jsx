"use client";

import { Target } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "none";

export default function TargetCompanySelect({
  value,
  onChange,
  companies = [],
  className,
}) {
  const selected = value || NONE;
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Target className="h-3.5 w-3.5" /> Target company (optional)
      </Label>
      <Select
        value={selected}
        onValueChange={(v) => onChange(v === NONE ? null : v)}
      >
        <SelectTrigger className="w-full" aria-label="Target company">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>None — general practice</SelectItem>
          {companies.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <p className="text-xs text-muted-foreground">
          Tailored to {companies.find((c) => c.slug === value)?.name ?? value} —
          questions + scoring will reflect its themes and values.
        </p>
      )}
    </div>
  );
}