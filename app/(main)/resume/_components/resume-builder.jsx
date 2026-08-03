"use client";

import { useState, useEffect, useId, cloneElement } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Code2,
  Eye,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { saveResume } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/lib/markdown";
import { resumeSchema } from "@/lib/schemas";
import { motion } from "framer-motion";

// The Markdown editor (~300kB) and the PDF engine (html2canvas + jsPDF,
// ~300kB+) are only used inside the "Markdown" tab / on download. Code-split
// them so users on the Form tab never download either, and the PDF libs are
// fetched only when "Download PDF" is clicked.
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[680px] w-full shimmer rounded-lg" />
  ),
});
const MDMarkdown = dynamic(
  () => import("@uiw/react-md-editor").then((m) => m.default.Markdown),
  { ssr: false }
);

const EASE = [0.22, 1, 0.36, 1];

export default function ResumeBuilder({ initialContent }) {
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent || "");
  const { user } = useUser();
  const [resumeMode, setResumeMode] = useState("preview");

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  const formValues = watch();

  useEffect(() => {
    if (initialContent) setActiveTab("preview");
  }, [initialContent]);

  useEffect(() => {
    if (activeTab === "edit") {
      const newContent = getCombinedContent();
      setPreviewContent(newContent ? newContent : initialContent || "");
    }
  }, [formValues, activeTab, initialContent]);

  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Resume saved successfully!");
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveResult, saveError, isSaving]);

  const getContactMarkdown = () => {
    const { contactInfo = {} } = formValues;
    const parts = [];
    if (contactInfo.email) parts.push(`📧 ${contactInfo.email}`);
    if (contactInfo.mobile) parts.push(`📱 ${contactInfo.mobile}`);
    if (contactInfo.linkedin) parts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo.twitter) parts.push(`🐦 [Twitter](${contactInfo.twitter})`);
    return parts.length > 0
      ? `## <div align="center">${user?.fullName || ""}</div>\n\n<div align="center">\n\n${parts.join(" | ")}\n\n</div>`
      : "";
  };

  const getCombinedContent = () => {
    const { summary, skills, experience, education, projects } = formValues || {};
    return [
      getContactMarkdown(),
      summary && `## Professional Summary\n\n${summary}`,
      skills && `## Skills\n\n${skills}`,
      entriesToMarkdown(experience || [], "Work Experience"),
      entriesToMarkdown(education || [], "Education"),
      entriesToMarkdown(projects || [], "Projects"),
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("resume-pdf");
      // Lazy-load the PDF engine only when actually exporting — keeps
      // html2canvas + jsPDF (~300kB) out of the route's initial bundle.
      const { default: html2pdf } = await import(
        "html2pdf.js/dist/html2pdf.min.js"
      );
      const opt = {
        margin: [15, 15],
        filename: "resume.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formattedContent = previewContent
        .replace(/\n/g, "\n")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();
      await saveResumeFn(formattedContent);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  // Resume completeness — a SaaS-style progress meter driven by how many
  // core sections have content. Purely presentational.
  const sectionsFilled = [
    !!(formValues.contactInfo?.email || formValues.contactInfo?.mobile || user?.fullName),
    !!(formValues.summary && formValues.summary.trim()),
    !!(formValues.skills && formValues.skills.trim()),
    (formValues.experience?.length || 0) > 0,
    (formValues.education?.length || 0) > 0,
    (formValues.projects?.length || 0) > 0,
  ];
  const filledCount = sectionsFilled.filter(Boolean).length;
  const completeness = Math.round((filledCount / sectionsFilled.length) * 100);

  return (
    <div className="w-full py-6 text-foreground">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full ring-aurora" />
            AI Resume Builder
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Build your resume
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Create a clean, ATS-friendly resume in minutes — the preview on the right updates live as you type.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="gap-2 font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>

          <Button
            variant="gradient"
            onClick={generatePDF}
            disabled={isGenerating}
            className="gap-2 font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ---- Completeness meter ---- */}
      <div className="mt-5 flex items-center gap-4 rounded-xl border border-border bg-card/50 px-4 py-3 backdrop-blur-sm">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-aurora text-white shadow-glow">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Resume completeness</span>
            <span className="tabular-nums text-muted-foreground">{completeness}%</span>
          </div>
          <Progress value={completeness} className="mt-2 h-1.5" />
        </div>
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
          {filledCount}/{sectionsFilled.length} sections
        </span>
      </div>

      {/* ---- Workspace ---- */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <TabsList className="inline-flex w-auto gap-1 rounded-lg border border-border bg-card/60 p-1 backdrop-blur-sm">
            <TabsTrigger
              value="edit"
              className="gap-1.5 rounded-md px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Builder
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="gap-1.5 rounded-md px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow"
            >
              <Code2 className="h-3.5 w-3.5" />
              Markdown
            </TabsTrigger>
          </TabsList>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Edits auto-save to your profile on click
          </span>
        </div>

        {/* ============ Builder tab: split form + live preview ============ */}
        <TabsContent value="edit">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
            {/* Form column */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <SectionCard icon={User} title="Contact information" hint="How recruiters reach you" delay={0}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Email" error={errors.contactInfo?.email?.message}>
                    <Input type="email" placeholder="your@email.com" {...register("contactInfo.email")} />
                  </Field>
                  <Field label="Mobile number" error={errors.contactInfo?.mobile?.message}>
                    <Input type="tel" placeholder="+1 234 567 8900" {...register("contactInfo.mobile")} />
                  </Field>
                  <Field label="LinkedIn" error={errors.contactInfo?.linkedin?.message}>
                    <Input type="url" placeholder="https://linkedin.com/in/your-profile" {...register("contactInfo.linkedin")} />
                  </Field>
                  <Field label="Twitter / X" error={errors.contactInfo?.twitter?.message}>
                    <Input type="url" placeholder="https://twitter.com/your-handle" {...register("contactInfo.twitter")} />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard icon={FileText} title="Professional summary" hint="A short pitch at the top of your resume" delay={0.06}>
                <Controller
                  name="summary"
                  control={control}
                  render={({ field }) => (
                    <Textarea {...field} className="h-28" placeholder="Write a compelling professional summary..." />
                  )}
                />
                {errors.summary && <p className="mt-1.5 text-xs text-destructive">{errors.summary.message}</p>}
              </SectionCard>

              <SectionCard icon={Sparkles} title="Skills" hint="Comma-separated keywords recruiters scan for" delay={0.12}>
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <Textarea {...field} className="h-24" placeholder="List your key skills..." />
                  )}
                />
                {errors.skills && <p className="mt-1.5 text-xs text-destructive">{errors.skills.message}</p>}
              </SectionCard>

              <SectionCard
                icon={Briefcase}
                title="Work experience"
                hint="Roles with impact-led descriptions"
                count={formValues.experience?.length || 0}
                delay={0.18}
              >
                <Controller
                  name="experience"
                  control={control}
                  render={({ field }) => <EntryForm type="Experience" entries={field.value} onChange={field.onChange} />}
                />
                {errors.experience && <p className="mt-1.5 text-xs text-destructive">{errors.experience.message}</p>}
              </SectionCard>

              <SectionCard
                icon={GraduationCap}
                title="Education"
                hint="Degrees, certifications, and coursework"
                count={formValues.education?.length || 0}
                delay={0.24}
              >
                <Controller
                  name="education"
                  control={control}
                  render={({ field }) => <EntryForm type="Education" entries={field.value} onChange={field.onChange} />}
                />
                {errors.education && <p className="mt-1.5 text-xs text-destructive">{errors.education.message}</p>}
              </SectionCard>

              <SectionCard
                icon={FolderGit2}
                title="Projects"
                hint="Work that shows what you can build"
                count={formValues.projects?.length || 0}
                delay={0.3}
              >
                <Controller
                  name="projects"
                  control={control}
                  render={({ field }) => <EntryForm type="Project" entries={field.value} onChange={field.onChange} />}
                />
                {errors.projects && <p className="mt-1.5 text-xs text-destructive">{errors.projects.message}</p>}
              </SectionCard>

              {/* Mobile save bar — keeps the primary action reachable while scrolling the form. */}
              <div className="flex gap-2 lg:hidden">
                <Button type="submit" variant="outline" disabled={isSaving} className="flex-1 gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
                <Button type="button" variant="gradient" onClick={generatePDF} disabled={isGenerating} className="flex-1 gap-2">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download PDF
                </Button>
              </div>
            </form>

            {/* Live preview column — sticky on large screens */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    Live preview
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Auto-updating
                  </span>
                </div>
                <div className="max-h-[640px] overflow-y-auto bg-white p-6 sm:p-8">
                  {previewContent ? (
                    <div data-color-mode="light" className="resume-paper">
                      <MDMarkdown source={previewContent} />
                    </div>
                  ) : (
                    <div className="flex h-64 flex-col items-center justify-center text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-neutral-100 text-neutral-400">
                        <FileText className="h-6 w-6" />
                      </span>
                      <p className="mt-3 text-sm font-medium text-neutral-500">Your resume preview appears here</p>
                      <p className="mt-1 text-xs text-neutral-400">Start filling in the form to see it update live.</p>
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                This is exactly what your downloaded PDF will look like.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ============ Markdown tab: raw editor ============ */}
        <TabsContent value="preview">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResumeMode(resumeMode === "preview" ? "edit" : "preview")}
                className="gap-2"
              >
                {resumeMode === "preview" ? (
                  <>
                    <Edit className="h-4 w-4" /> Edit Markdown
                  </>
                ) : (
                  <>
                    <Monitor className="h-4 w-4" /> Show Preview
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(previewContent || "")}>
                  Copy Markdown
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setActiveTab("edit");
                    toast("Switching to Builder for edits");
                  }}
                >
                  Edit Form
                </Button>
              </div>
            </div>

            {resumeMode !== "preview" && (
              <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-amber-500">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-xs">You will lose edited markdown if you update the form data.</span>
              </div>
            )}

            <div className="p-4" data-color-mode="dark">
              <MDEditor value={previewContent} onChange={setPreviewContent} height={680} preview={resumeMode} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden, always-mounted render target for PDF export. Kept in the DOM
          on both tabs so "Download PDF" works from anywhere. */}
      <div className="hidden" aria-hidden="true">
        <div id="resume-pdf" data-color-mode="light">
          <MDMarkdown source={previewContent} style={{ background: "white", color: "black" }} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Local helpers ---------- */

function Field({ label, error, children }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      {cloneElement(children, { id })}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SectionCard({ icon: Icon, title, hint, count, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors duration-300 hover:border-white/10"
    >
      <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-5 py-3.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
        {count != null && count > 0 && (
          <Badge variant="secondary" className="shrink-0 tabular-nums">{count}</Badge>
        )}
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}