"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { changeIndustry } from "@/actions/user";
import { industries } from "@/data/industries";

/**
 * Lets an onboarded user switch the industry they track. On confirm we update
 * user.industry (which re-points the User→IndustryInsight relation) and refresh
 * the dashboard so the new industry's trends render.
 */
export default function ChangeIndustryDialog({ currentIndustry }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [industryId, setIndustryId] = useState(null);
  const [subIndustry, setSubIndustry] = useState(null);

  const {
    loading: changing,
    fn: changeFn,
    data: result,
  } = useFetch(changeIndustry);

  // Reset the form whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) {
      setIndustryId(null);
      setSubIndustry(null);
    }
  }, [open]);

  // Refresh the dashboard once the server confirms the change.
  useEffect(() => {
    if (result?.success && !changing) {
      toast.success(result.unchanged
        ? "You're already tracking that industry."
        : "Industry updated — showing fresh trends.");
      setOpen(false);
      router.refresh();
    }
  }, [result, changing, router]);

  const selectedIndustry = industries.find((i) => i.id === industryId);
  const canConfirm = Boolean(industryId && subIndustry && !changing);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    try {
      await changeFn({ industry: industryId, subIndustry });
    } catch (error) {
      toast.error(error?.message || "Couldn't change your industry.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          Change industry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Change your industry
          </DialogTitle>
          <DialogDescription>
            Pick a different industry and specialization to explore its market
            trends, salary ranges, and in-demand skills. Your profile stays the
            same — only the tracked industry changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="ci-industry">Industry</Label>
            <Select
              onValueChange={(value) => {
                setIndustryId(value);
                setSubIndustry(null);
              }}
              value={industryId ?? undefined}
            >
              <SelectTrigger id="ci-industry">
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Industries</SelectLabel>
                  {industries.map((ind) => (
                    <SelectItem key={ind.id} value={ind.id}>
                      {ind.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ci-sub">Specialization</Label>
            <Select
              onValueChange={setSubIndustry}
              value={subIndustry ?? undefined}
              disabled={!selectedIndustry}
            >
              <SelectTrigger id="ci-sub">
                <SelectValue placeholder="Select a specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Specializations</SelectLabel>
                  {selectedIndustry?.subIndustries.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {currentIndustry && (
            <p className="text-xs text-muted-foreground">
              Currently tracking:{" "}
              <span className="font-medium text-foreground">
                {currentIndustry}
              </span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={changing}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm} className="gap-1.5">
            {changing && <Loader2 className="h-4 w-4 animate-spin" />}
            {changing ? "Updating…" : "Update industry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}