import { z } from "zod";
import { DREAM_COMPANY_SLUGS } from "@/lib/constants";

export const onboardingSchema = z.object({
  industry: z.string({
    required_error: "Please select an industry",
  }),
  subIndustry: z.string({
    required_error: "Please select a specialization",
  }),
  bio: z.string().max(500).optional(),
  // Tolerant of both the raw form value (string) and the already-transformed
  // value the client resolver passes through (number). The form's
  // zodResolver runs this schema client-side, so by the time the payload
  // reaches the server action it's already a number — re-parsing with a
  // string-only schema would reject it ("Expected string, received number").
  experience: z.preprocess(
    (val) => (val === "" || val == null ? undefined : Number(val)),
    z
      .number({
        required_error: "Years of experience is required",
        invalid_type_error: "Please enter a valid number of years",
      })
      .min(0, "Experience must be at least 0 years")
      .max(50, "Experience cannot exceed 50 years")
  ),
  // Same dual-form tolerance: accept a comma-separated string (raw input) or
  // an already-split array (post client-transform), normalizing to an array.
  skills: z.preprocess(
    (val) => {
      if (val == null) return "";
      if (Array.isArray(val)) return val.join(",");
      return String(val);
    },
    z.string().transform((val) =>
      val
        ? val
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)
        : undefined
    )
  ),
});

export const contactSchema = z.object({
  email: z.string().email("Invalid email address"),
  mobile: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
});

export const entrySchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    organization: z.string().min(1, "Organization is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    current: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (!data.current && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "End date is required unless this is your current position",
      path: ["endDate"],
    }
  );

export const resumeSchema = z.object({
  contactInfo: contactSchema,
  summary: z.string().min(1, "Professional summary is required"),
  skills: z.string().min(1, "Skills are required"),
  experience: z.array(entrySchema),
  education: z.array(entrySchema),
  projects: z.array(entrySchema),
});

export const coverLetterSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().min(1, "Job description is required"),
});

// Boundary validation for AI resume improvement requests.
export const improveEntrySchema = z.object({
  current: z.string().min(1, "Please enter a description first"),
  type: z.string().min(1),
});

// Boundary validation for saved quiz results.
export const saveQuizResultSchema = z.object({
  questions: z.array(z.any()),
  answers: z.array(z.any()),
  score: z.number(),
  // Dream Company Mode — optional slug when the quiz was company-tailored.
  // Omitted by existing clients → undefined → byte-identical behavior.
  company: z.string().optional(),
});

// Application tracker — one job application in the pipeline.
export const applicationSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  location: z.string().optional(),
  salary: z.string().optional(),
  jobUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  jobDescription: z.string().optional(),
  status: z.enum([
    "SAVED",
    "APPLIED",
    "SCREENING",
    "INTERVIEW",
    "OFFER",
    "REJECTED",
  ]),
  notes: z.string().optional(),
  // Career OS (M6) — outcome context for terminal statuses.
  rejectionReason: z.string().max(2000).optional(),
  offerDetails: z
    .object({
      baseSalary: z.string().optional(),
      totalComp: z.string().optional(),
      deadline: z.string().optional(),
      negotiator: z.string().optional(),
      notes: z.string().optional(),
    })
    .partial()
    .optional(),
  // Career OS (M6) — link to resume + cover-letter artifacts.
  resumeId: z.string().optional(),
  coverLetterId: z.string().optional(),
});

// Linking artifacts to an application — both optional, ownership validated in
// the action against the signed-in user's resume/cover-letter rows.
export const linkArtifactsSchema = z.object({
  resumeId: z.string().optional().nullable(),
  coverLetterId: z.string().optional().nullable(),
});

// Mock-interview save — the transcript + AI score/feedback.
export const mockInterviewSchema = z.object({
  role: z.string().min(1, "Role is required"),
  transcript: z.array(
    z.object({
      role: z.enum(["interviewer", "candidate"]),
      text: z.string(),
    })
  ),
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  // Dream Company Mode — optional slug when the session was company-tailored.
  // Omitted by existing clients → undefined → byte-identical behavior.
  company: z.string().optional(),
});

// Lightweight inputs for the on-demand AI helpers.
export const rewriteAchievementSchema = z.object({
  bullet: z.string().min(1, "Enter a bullet to rewrite").max(1000),
});

export const roadmapSchema = z.object({
  targetRole: z.string().min(1, "Enter a target role").max(200),
  currentSkills: z.string().max(1000).optional(),
});

export const outreachSchema = z.object({
  targetCompany: z.string().min(1, "Company is required").max(200),
  targetRole: z.string().min(1, "Role is required").max(200),
  kind: z.enum(["linkedin", "email"]).optional(),
});

export const jobFitSchema = z.object({
  jobDescription: z.string().min(1, "Job description is required").max(20000),
});

// Razorpay checkout — plan + billing cycle for order creation.
export const createOrderSchema = z.object({
  planId: z.enum(["PRO", "TEAMS"]),
  billingCycle: z.enum(["monthly", "annual"]),
});

// Razorpay checkout — client posts back the payment identifiers + signature.
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  planId: z.enum(["PRO", "TEAMS"]),
  billingCycle: z.enum(["monthly", "annual"]),
});

// Notifications — mark a single notification as read by id.
export const markNotificationReadSchema = z.object({
  id: z.string().min(1, "Notification id is required."),
});

// ── Career OS ─────────────────────────────────────────────────────

// Persistent chat — a user message sent to the Coach. The Coordinator routes
// it to specialized agents and synthesizes a reply.
export const chatSchema = z.object({
  text: z.string().min(1, "Please enter a message").max(8000),
  sessionId: z.string().optional(),
});

// Manual memory entry — added via the /coach memory drawer.
export const memorySchema = z.object({
  type: z.enum([
    "identity",
    "career",
    "interview",
    "application",
    "learning",
    "project",
    "github",
    "preference",
    "skill",
    "achievement",
  ]),
  content: z.string().min(1, "Content is required").max(4000),
  tags: z.array(z.string()).optional(),
  importance: z.number().min(0).max(1).optional(),
});

// Timeline filter — optional range + type filter for the /timeline view.
export const timelineFilterSchema = z.object({
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  types: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

// GitHub Project Analyzer (M7) — connect a repo. `fullName` is owner/repo;
// `pat` is an optional Personal Access Token (only its sha256 is stored; the
// token itself travels in the Inngest event payload and is discarded after).
export const connectRepoSchema = z.object({
  fullName: z
    .string()
    .min(3, "Enter a repo as owner/repo")
    .max(100)
    .regex(
      /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/,
      "Enter the repo as owner/repo (e.g. vercel/next.js)"
    ),
  pat: z.string().max(200).optional(),
});

// Learning Engine (M9) — upsert a learning topic + log a session + set a goal.
export const upsertTopicSchema = z.object({
  id: z.string().optional(),
  skill: z.string().min(1, "Skill is required").max(120),
  status: z.enum(["todo", "learning", "learned", "needs_review"]).optional(),
  proficiency: z.number().min(0).max(1).optional(),
  notes: z.string().max(2000).optional(),
});

export const logLearningSessionSchema = z.object({
  topicId: z.string().optional().nullable(),
  kind: z.enum(["quiz", "mock", "chat", "resource", "project"]),
  summary: z.string().max(2000).optional(),
  outcome: z.any().optional(),
  durationMin: z.number().int().min(0).max(600).optional(),
});

export const careerGoalSchema = z.object({
  targetRole: z.string().min(1, "Target role is required").max(200),
  targetLevel: z.string().max(120).optional(),
  timeframe: z.string().max(120).optional(),
  rationale: z.string().max(2000).optional(),
});

// ── Dream Company Mode ─────────────────────────────────────────────
// Setting/clearing the user's dream-company target. `company` must be one of
// the DREAM_COMPANY_SLUGS. Used by setTargetCompany.
export const targetCompanySchema = z.object({
  company: z.enum(DREAM_COMPANY_SLUGS),
});

// ── Memory Engine — structured memory ──────────────────────────────
// Per-category typed payloads stored in StructuredMemory.structured. Each is
// optional-shaped except the identity-carrying fields, so the UI form can be
// sparse. The union validator picks the right payload by `category`.

const structuredProjectSchema = z.object({
  stack: z.array(z.string()).optional(),
  role: z.string().max(200).optional(),
  url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["shipped", "ongoing", "archived"]).optional(),
  metrics: z.string().max(500).optional(),
  highlights: z.array(z.string()).optional(),
});

const structuredSkillSchema = z.object({
  name: z.string().min(1, "Skill name is required").max(120),
  level: z.number().min(0).max(1),
  evidence: z.string().max(1000).optional(),
  context: z.string().max(500).optional(),
  selfRated: z.boolean().optional(),
});

const structuredAchievementSchema = z.object({
  metric: z.string().max(300).optional(),
  context: z.string().max(500).optional(),
  date: z.string().max(40).optional(),
  impact: z.string().max(1000).optional(),
});

const structuredCertificateSchema = z.object({
  issuer: z.string().min(1, "Issuer is required").max(200),
  credentialId: z.string().max(200).optional(),
  issuedAt: z.string().max(40).optional(),
  expiresAt: z.string().max(40).optional(),
  url: z.string().url().optional().or(z.literal("")),
});

const structuredPreferenceSchema = z.object({
  key: z.string().min(1, "Preference key is required").max(120),
  value: z.string().min(1, "Preference value is required").max(1000),
  scope: z.enum(["jobSearch", "interview", "learning", "general"]).optional(),
});

const structuredResumeVersionSchema = z.object({
  label: z.string().min(1, "Label is required").max(120),
  snapshot: z.string().min(1),
  atsScore: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

const structuredLessonSchema = z.object({
  severity: z.enum(["low", "med", "high"]).optional(),
  source: z.enum(["mock", "interview", "quiz", "application"]).optional(),
  takeaway: z.string().min(1, "Takeaway is required").max(2000),
  relatedSkill: z.string().max(120).optional(),
});

const structuredNoteSchema = z.object({
  context: z.string().max(1000).optional(),
});

export const STRUCTURED_MEMORY_PAYLOAD_SCHEMAS = {
  project: structuredProjectSchema,
  skill: structuredSkillSchema,
  achievement: structuredAchievementSchema,
  certificate: structuredCertificateSchema,
  preference: structuredPreferenceSchema,
  resume_version: structuredResumeVersionSchema,
  lesson: structuredLessonSchema,
  note: structuredNoteSchema,
};

/**
 * Validate a structured-memory write. The `category` decides which payload
 * schema validates `structured`. Common fields (title/summary/detail/tags/
 * importance) are always required-or-optional the same way.
 */
export const structuredMemorySchema = z
  .object({
    category: z.enum([
      "project",
      "skill",
      "achievement",
      "certificate",
      "preference",
      "resume_version",
      "lesson",
      "note",
    ]),
    title: z.string().min(1, "Title is required").max(200),
    summary: z.string().max(500).optional(),
    detail: z.string().max(20000).optional(),
    tags: z.array(z.string().max(60)).max(20).optional(),
    importance: z.number().min(0).max(1).optional(),
    linkedType: z
      .enum(["resume", "mockInterview", "assessment", "application", "learningTopic", "goal"])
      .optional(),
    linkedId: z.string().max(120).optional(),
    structured: z.any().optional(),
  })
  .refine(
    (data) => {
      const schema = STRUCTURED_MEMORY_PAYLOAD_SCHEMAS[data.category];
      if (!schema) return true; // unknown category → skip payload validation
      if (data.structured == null) return true; // payload optional at write time
      return schema.safeParse(data.structured).success;
    },
    { message: "Invalid structured payload for this category." }
  );

// Update variant — id + every field optional (patch semantics).
export const structuredMemoryUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(500).optional(),
  detail: z.string().max(20000).optional(),
  tags: z.array(z.string().max(60)).max(20).optional(),
  importance: z.number().min(0).max(1).optional(),
  structured: z.any().optional(),
});