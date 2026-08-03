/**
 * Retrieval Router — classifies a user message into a retrieval intent and
 * decides which structured sources to pull. Pure: no DB, no IO. Tokenization
 * reuses `relevance.tokenize` so intent keywords and retrieval keywords share
 * the same notion of a "word".
 *
 * The router returns the intent + the per-type weight map (`typeWeights`) that
 * `relevance.scoreMemory` consumes, + the StructuredMemory categories + the
 * freeform MemoryEntry types to recall, + extracted entities (company/role
 * candidates) used by the dedicated-source fetch to match Application.company.
 *
 * Intent priority (highest first) breaks ties: interview > application > resume
 * > learning > goal > general. "I have a Google interview" → interview.
 */
import { tokenize } from "@/lib/career/memory/relevance";

// Keyword sets per intent. Matched against the tokenized query (Set of words).
// A query need only contain one keyword to score the intent; more = stronger.
const INTENT_KEYWORDS = {
  interview: [
    "interview", "interviews", "interviewing", "recruiter", "recruiters",
    "offer", "offers", "hiring", "hired", "prep", "prepare", "mock",
    "technical", "behavioral", "behavioural", "onsite", "screening", "round",
    "panel", "system", "design", "coding", "leetcode", "whiteboard", "loop",
  ],
  application: [
    "application", "applications", "apply", "applied", "applying", "cover",
    "letter", "coverletter", "job", "jobs", "position", "positions", "opening",
    "openings", "pipeline", "follow", "up", "followup", "referral", "refer",
  ],
  resume: [
    "resume", "cv", "bullet", "bullets", "ats", "summary", "portfolio",
    "experience", "rewrite", "reword", "polish",
  ],
  learning: [
    "learn", "learning", "skill", "skills", "course", "courses", "study",
    "practice", "roadmap", "upskill", "upskilling", "topic", "topics", "weak",
    "improve", "improving", "gap", "gaps", "master", "review",
  ],
  goal: [
    "goal", "goals", "target", "career", "path", "plan", "planning",
    "aspiration", "aspirations", "ambition", "level", "promote", "promotion",
    "switch", "transition", "become",
  ],
};

// Intent priority — first match wins on a tie.
const INTENT_PRIORITY = ["interview", "application", "resume", "learning", "goal"];

// Known big-tech / common employer names. Presence strongly hints at an
// interview/application intent + gives the dedicated-source fetch a company
// token to match against Application.company. Kept small and obvious.
const KNOWN_COMPANIES = new Set([
  "google", "amazon", "microsoft", "meta", "facebook", "apple", "netflix",
  "tesla", "nvidia", "openai", "anthropic", "uber", "lyft", "airbnb",
  "stripe", "shopify", "twitter", "linkedin", "snapchat", "adobe", "oracle",
  "salesforce", "sap", "ibm", "intel", "spotify", "dropbox", "github",
]);

// StructuredMemory categories to fetch per intent. `general` = all.
const INTENT_CATEGORIES = {
  interview: ["lesson", "project", "skill", "achievement", "certificate"],
  application: ["project", "achievement", "preference", "skill"],
  resume: ["achievement", "project", "certificate", "skill"],
  learning: ["skill", "certificate", "lesson"],
  goal: ["project", "achievement", "skill", "certificate"],
  general: [
    "project", "skill", "achievement", "certificate", "preference",
    "resume_version", "lesson", "note",
  ],
};

// Freeform MemoryEntry types to recall per intent (alongside structured).
const INTENT_MEMORY_TYPES = {
  interview: ["interview", "skill", "career", "achievement"],
  application: ["application", "career", "identity"],
  resume: ["identity", "achievement", "project"],
  learning: ["learning", "skill", "project"],
  goal: ["career", "identity", "skill"],
  general: [],
};

// Per-type weights for `scoreMemory`. The dedicated-model "types" (mockInterview,
// assessment, resume, learningTopic, careerGoal, application, coverLetter,
// githubRepo) are weighted here too so dedicated sources rank within an intent.
const INTENT_TYPE_WEIGHTS = {
  interview: {
    lesson: 0.95, mockInterview: 1.0, assessment: 0.9, resume: 0.85,
    learningTopic: 0.8, skill: 0.7, project: 0.6, achievement: 0.6,
    certificate: 0.5, careerGoal: 0.55, interview: 0.85, career: 0.5,
  },
  application: {
    application: 1.0, coverLetter: 0.85, resume: 0.7, project: 0.6,
    achievement: 0.6, preference: 0.6, skill: 0.5, career: 0.5,
  },
  resume: {
    resume: 1.0, achievement: 0.85, project: 0.8, certificate: 0.75,
    skill: 0.7, githubRepo: 0.6, assessment: 0.6, identity: 0.5,
  },
  learning: {
    learningTopic: 1.0, learningSession: 0.85, skill: 0.85, certificate: 0.7,
    lesson: 0.7, assessment: 0.6, learning: 0.8,
  },
  goal: {
    careerGoal: 1.0, skill: 0.7, project: 0.65, achievement: 0.65,
    certificate: 0.6, learningTopic: 0.6, career: 0.7,
  },
  general: {},
};

/**
 * Classify a user query into a retrieval intent.
 * @param {string} query
 * @returns {{ intent: string, typeWeights: Record<string,number>, categories: string[], memoryTypes: string[], entities: { companies: string[], terms: string[] } }}
 */
export function classifyIntent(query) {
  const tokens = tokenize(query);
  if (!tokens.size) {
    return defaultRouter("general");
  }

  // Count keyword hits per intent.
  const scores = {};
  for (const intent of INTENT_PRIORITY) {
    let hits = 0;
    for (const kw of INTENT_KEYWORDS[intent]) {
      if (tokens.has(kw)) hits++;
    }
    scores[intent] = hits;
  }
  scores.general = 0;

  // Pick the highest-scoring intent; tie-break by priority order.
  let best = "general";
  let bestHits = 0;
  for (const intent of [...INTENT_PRIORITY, "general"]) {
    if (scores[intent] > bestHits) {
      best = intent;
      bestHits = scores[intent];
    }
  }

  // Entities: known companies + non-stopword terms that aren't intent keywords.
  const companies = [];
  for (const c of KNOWN_COMPANIES) if (tokens.has(c)) companies.push(c);

  const intentKw = new Set(
    INTENT_PRIORITY.flatMap((i) => INTENT_KEYWORDS[i])
  );
  const terms = [];
  for (const t of tokens) {
    if (intentKw.has(t) || KNOWN_COMPANIES.has(t)) continue;
    terms.push(t);
  }

  return {
    intent: best,
    typeWeights: INTENT_TYPE_WEIGHTS[best] || {},
    categories: INTENT_CATEGORIES[best],
    memoryTypes: INTENT_MEMORY_TYPES[best],
    entities: { companies, terms },
  };
}

function defaultRouter(intent) {
  return {
    intent,
    typeWeights: INTENT_TYPE_WEIGHTS[intent] || {},
    categories: INTENT_CATEGORIES[intent],
    memoryTypes: INTENT_MEMORY_TYPES[intent],
    entities: { companies: [], terms: [] },
  };
}

// Section labels per source type, in render order per intent. The renderer
// walks this order so the "interview" case always shows INTERVIEW HISTORY first.
export const INTENT_SECTION_ORDER = {
  interview: [
    "interview_history", "resume", "projects", "weak_skills",
    "previous_mistakes", "study_plan", "certificates", "achievements",
  ],
  application: ["applications", "resume", "projects", "achievements", "preferences"],
  resume: ["resume", "achievements", "projects", "certificates", "skills", "github"],
  learning: ["learning", "skills", "lessons", "certificates"],
  goal: ["goal", "skills", "projects", "achievements", "certificates"],
  general: ["relevant_memories"],
};

// Map a normalized item's `kind` to its section label.
export const KIND_TO_SECTION = {
  mockInterview: "interview_history",
  assessment: "interview_history",
  resume: "resume",
  structured_project: "projects",
  structured_resume_version: "resume",
  learningTopic: "weak_skills",
  learningSession: "study_plan",
  structured_lesson: "previous_mistakes",
  careerGoal: "goal",
  application: "applications",
  coverLetter: "applications",
  githubRepo: "github",
  structured_skill: "skills",
  structured_certificate: "certificates",
  structured_achievement: "achievements",
  structured_preference: "preferences",
  structured_note: "relevant_memories",
  memoryEntry: "relevant_memories",
};

// Human-readable section headings (rendered in the prompt block + the preview UI).
export const SECTION_LABELS = {
  interview_history: "Interview history",
  resume: "Resume",
  projects: "Projects",
  weak_skills: "Weak skills / study plan",
  previous_mistakes: "Previous mistakes",
  study_plan: "Recommended study plan",
  certificates: "Certificates",
  achievements: "Achievements",
  preferences: "Preferences",
  applications: "Applications",
  goal: "Career goal",
  skills: "Skills",
  learning: "Learning progress",
  lessons: "Lessons learned",
  github: "GitHub repos",
  relevant_memories: "Relevant memories",
};