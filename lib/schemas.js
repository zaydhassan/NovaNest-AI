import { z } from "zod";

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