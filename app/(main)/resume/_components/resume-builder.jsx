"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveResume } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/lib/markdown";
import { resumeSchema } from "@/lib/schemas";
import html2pdf from "html2pdf.js/dist/html2pdf.min.js";
import { motion } from "framer-motion";

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

  return (
    <div className="min-h-screen w-full bg-background py-10 px-4 md:px-8 text-foreground">
      <div className="relative flex flex-col justify-between gap-4 border-b border-border pb-8 mb-10 md:flex-row md:items-center">
        <div className="relative z-10">
          <h1 className="aurora-text animate-aurora pb-2 text-4xl font-extrabold tracking-tight md:text-5xl">
            Resume Builder
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a clean, ATS-friendly resume in minutes.</p>
        </div>

        <div className="flex gap-2 z-10">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              className="font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              className="gap-2 font-semibold shadow-glow"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="max-w-4xl mx-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0.02))] border border-white/6 rounded-2xl shadow-[0_10px_40px_rgba(2,6,23,0.6)] p-4"
      >
        <TabsList className="w-full flex justify-center gap-6 py-2 rounded bg-gray-900/40 mb-4">
          <TabsTrigger value="edit" className="text-base font-medium text-gray-200">Form</TabsTrigger>
          <TabsTrigger value="preview" className="text-base font-medium text-gray-200">Markdown</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-white">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-800 rounded-lg bg-gray-950">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Email</label>
                  <Input
                    {...register("contactInfo.email")}
                    type="email"
                    placeholder="your@email.com"
                    className="bg-gray-900 text-gray-100 border-gray-700 focus:ring-2 focus:ring-purple-600"
                  />
                  {errors.contactInfo?.email && <p className="text-xs text-red-400">{errors.contactInfo.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Mobile Number</label>
                  <Input
                    {...register("contactInfo.mobile")}
                    type="tel"
                    placeholder="+1 234 567 8900"
                    className="bg-gray-900 text-gray-100 border-gray-700 focus:ring-2 focus:ring-purple-600"
                  />
                  {errors.contactInfo?.mobile && <p className="text-xs text-red-400">{errors.contactInfo.mobile.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">LinkedIn</label>
                  <Input
                    {...register("contactInfo.linkedin")}
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                    className="bg-gray-900 text-gray-100 border-gray-700 focus:ring-2 focus:ring-purple-600"
                  />
                  {errors.contactInfo?.linkedin && <p className="text-xs text-red-400">{errors.contactInfo.linkedin.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Twitter/X</label>
                  <Input
                    {...register("contactInfo.twitter")}
                    type="url"
                    placeholder="https://twitter.com/your-handle"
                    className="bg-gray-900 text-gray-100 border-gray-700 focus:ring-2 focus:ring-purple-600"
                  />
                  {errors.contactInfo?.twitter && <p className="text-xs text-red-400">{errors.contactInfo.twitter.message}</p>}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.06 }} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Professional Summary</h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32 bg-gray-950 text-gray-100 border-gray-700 rounded focus:ring-2 focus:ring-pink-500"
                    placeholder="Write a compelling professional summary..."
                  />
                )}
              />
              {errors.summary && <p className="text-xs text-red-400">{errors.summary.message}</p>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.12 }} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Skills</h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32 bg-gray-950 text-gray-100 border-gray-700 rounded focus:ring-2 focus:ring-indigo-500"
                    placeholder="List your key skills..."
                  />
                )}
              />
              {errors.skills && <p className="text-xs text-red-400">{errors.skills.message}</p>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.18 }} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Work Experience</h3>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => <EntryForm type="Experience" entries={field.value} onChange={field.onChange} />}
              />
              {errors.experience && <p className="text-xs text-red-400">{errors.experience.message}</p>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.24 }} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Education</h3>
              <Controller
                name="education"
                control={control}
                render={({ field }) => <EntryForm type="Education" entries={field.value} onChange={field.onChange} />}
              />
              {errors.education && <p className="text-xs text-red-400">{errors.education.message}</p>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.30 }} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Projects</h3>
              <Controller
                name="projects"
                control={control}
                render={({ field }) => <EntryForm type="Project" entries={field.value} onChange={field.onChange} />}
              />
              {errors.projects && <p className="text-xs text-red-400">{errors.projects.message}</p>}
            </motion.div>
          </form>
        </TabsContent>

        <TabsContent value="preview">
          {activeTab === "preview" && (
            <div className="mb-4 flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                className="text-gray-200"
                onClick={() => setResumeMode(resumeMode === "preview" ? "edit" : "preview")}
              >
                {resumeMode === "preview" ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" /> Edit Resume
                  </>
                ) : (
                  <>
                    <Monitor className="h-4 w-4 mr-2" /> Show Preview
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button onClick={() => navigator.clipboard?.writeText(previewContent || "")} className="bg-gray-800 text-gray-200">Copy Markdown</Button>
                <Button onClick={() => { setActiveTab("edit"); toast("Switching to Form for edits"); }} className="bg-gray-800 text-gray-200">Edit Form</Button>
              </div>
            </div>
          )}

          {activeTab === "preview" && resumeMode !== "preview" && (
            <div className="flex p-3 gap-2 items-center border-2 border-yellow-800 text-yellow-500 rounded mb-2 bg-gray-950">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-xs">You will lose edited markdown if you update the form data.</span>
            </div>
          )}

          <div className="border rounded-lg bg-gray-900 shadow overflow-hidden">
            <div className="p-3 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
              <div className="text-sm text-gray-300">Live Markdown / Preview</div>
              <div className="text-xs text-gray-400">Mode: {resumeMode}</div>
            </div>
            <div className="p-4">
              <MDEditor value={previewContent} onChange={setPreviewContent} height={680} preview={resumeMode} />
            </div>
          </div>

          <div className="hidden">
            <div id="resume-pdf">
              <MDEditor.Markdown source={previewContent} style={{ background: "white", color: "black" }} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}