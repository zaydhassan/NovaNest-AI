import { computeNovaScore } from "@/lib/nova-score";
import { computeHealthScore } from "@/lib/career/career/career-engine";
import { computeInterviewReadiness } from "@/lib/career/career/readiness";
import { computeSkillGrowth } from "@/lib/career/career/skill-growth";
import { XP_BY_EVENT } from "@/lib/gamify";
import { format } from "date-fns";

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + Number(x) || 0, 0) / xs.length : 0);
const DAY_MS = 24 * 60 * 60 * 1000;

function levelFor(levels, score) {
  let chosen = levels[0];
  for (const l of levels) if (score >= l.min) chosen = l;
  return chosen;
}

function tryParseJSON(s) {
  if (s == null) return null;
  if (typeof s === "object") return s;
  try {
    return JSON.parse(String(s));
  } catch {
    return null;
  }
}

function metric(key, label, score, levels, evidence, why, how, whatToImprove, chart = {}) {
  const lvl = levelFor(levels, score);
  return {
    key,
    label,
    score,
    level: lvl.label,
    levelBlurb: lvl.blurb,
    evidence,
    why,
    how,
    whatToImprove,
    ...chart,
  };
}

const GENERIC_LEVELS = [
  { min: 0, label: "Getting started", blurb: "Not enough activity yet — start with one action below." },
  { min: 26, label: "Building", blurb: "You're putting in reps. Keep the cadence." },
  { min: 51, label: "Strong", blurb: "Solid momentum — you're in good shape." },
  { min: 76, label: "Exceptional", blurb: "Top-tier — maintain and optimize." },
];

const READINESS_SCORE_LEVELS = [
  { min: 0, label: "Not ready", blurb: "Run a mock interview to calibrate." },
  { min: 35, label: "Warming up", blurb: "Keep going — a few more sessions will sharpen you." },
  { min: 60, label: "Interview-ready", blurb: "You're prepared to take real interviews." },
  { min: 80, label: "Locked in", blurb: "Strong across the board — go land it." },
];

const VELOCITY_LEVELS = [
  { min: 0, label: "Idle", blurb: "No recent practice — log a session this week." },
  { min: 26, label: "Slow", blurb: "Some practice; pick up the weekly cadence." },
  { min: 51, label: "Steady", blurb: "Consistent weekly practice — keep it up." },
  { min: 76, label: "High velocity", blurb: "Excellent pace — you're learning fast." },
];

const APPLICATION_LEVELS = [
  { min: 0, label: "No pipeline", blurb: "Start logging applications to build a funnel." },
  { min: 26, label: "Early funnel", blurb: "Applications are in — push them forward." },
  { min: 51, label: "Converting", blurb: "You're reaching interviews — refine targeting." },
  { min: 76, label: "Strong closer", blurb: "Healthy funnel with offers landing." },
];

const CONSISTENCY_LEVELS = [
  { min: 0, label: "Inactive", blurb: "Show up today to start a streak." },
  { min: 26, label: "Occasional", blurb: "Some activity — aim for daily reps." },
  { min: 51, label: "Consistent", blurb: "You're showing up regularly." },
  { min: 76, label: "Locked in", blurb: "Daily-class consistency — excellent." },
];

const PILLAR_LABELS = {
  resume: "Resume",
  interview: "Interview",
  coverLetter: "Cover letters",
  applications: "Applications",
  marketFit: "Market fit",
  learning: "Learning",
  memory: "Memory",
};

const PILLAR_ACTION = {
  resume: "save or polish your resume",
  interview: "run mock interviews or take quizzes",
  coverLetter: "generate a tailored cover letter",
  applications: "log and advance applications",
  marketFit: "add skills from your industry's recommended list",
  learning: "log a learning session or mark a topic learned",
  memory: "capture memories (projects, skills, achievements)",
};

function assembleCareerHealth(health) {
  if (!health) {
    return metric(
      "careerHealth",
      "Career Health",
      0,
      GENERIC_LEVELS,
      [],
      "No career activity recorded yet.",
      "Save a resume, run a mock, or log an application to start your Career Health score.",
      "Complete onboarding and save your first resume."
    );
  }
  const breakdown = health.breakdown || {};
  const ranked = Object.keys(PILLAR_LABELS)
    .map((k) => ({ k, v: Number(breakdown[k]) || 0 }))
    .sort((a, b) => a.v - b.v);
  const weakest = ranked[0];
  const next = ranked[1];
  const evidence = ranked.map(({ k, v }) => ({
    label: PILLAR_LABELS[k],
    value: v,
    detail: v < 26 ? "weakest area" : v > 75 ? "strength" : undefined,
  }));

  const why =
    weakest && weakest.v < 26
      ? `Your Career Health is ${health.score}/100 — held back by your ${PILLAR_LABELS[weakest.k]} pillar at ${weakest.v}/100.`
      : `Your Career Health is ${health.score}/100, led by strong ${PILLAR_LABELS[ranked[ranked.length - 1].k]} (${ranked[ranked.length - 1].v}) with room to grow ${PILLAR_LABELS[weakest.k]} (${weakest.v}).`;

  const how = `Raise your ${PILLAR_LABELS[weakest.k]} pillar — it's the biggest lever (+${Math.max(
    1,
    26 - (weakest.v || 0)
  )} to reach the next tier).`;

  const whatToImprove = weakest
    ? `Focus on ${PILLAR_LABELS[weakest.k]}: ${PILLAR_ACTION[weakest.k]}${
        next && next.v < 26 ? `, then ${PILLAR_LABELS[next.k]}` : ""
      }.`
    : "Keep balancing activity across all pillars.";

  return metric("careerHealth", "Career Health", health.score, GENERIC_LEVELS, evidence, why, how, whatToImprove, {
    delta: health.delta ?? 0,
  });
}

const RESUME_SECTIONS = [
  "professional summary",
  "skills",
  "work experience",
  "education",
  "projects",
  "@",
];

function assembleResumeScore({ resume, novaBreakdown }) {
  const novaResume = Number(novaBreakdown?.resume) || 0;
  const ats = resume?.atsScore != null ? Number(resume.atsScore) : null;
  const score = ats != null ? clamp(ats) : novaResume;
  const fb = tryParseJSON(resume?.feedback);
  const evidence = [];

  if (ats != null) evidence.push({ label: "ATS match", value: `${ats}/100` });
  evidence.push({ label: "Section completeness (NovaScore pillar)", value: novaResume });

  if (resume?.content) {
    const c = String(resume.content).toLowerCase();
    const present = RESUME_SECTIONS.filter((s) => c.includes(s));
    const missing = RESUME_SECTIONS.filter((s) => !c.includes(s));
    evidence.push({
      label: "Sections detected",
      value: `${present.length}/${RESUME_SECTIONS.length}`,
      detail: missing.length ? `missing: ${missing.join(", ")}` : "all key sections present",
    });
  }

  if (fb) {
    if (Array.isArray(fb.matchedKeywords))
      evidence.push({ label: "Matched keywords", value: fb.matchedKeywords.length });
    if (Array.isArray(fb.missingKeywords))
      evidence.push({
        label: "Missing keywords",
        value: fb.missingKeywords.length,
        detail: fb.missingKeywords.slice(0, 5).join(", ") || undefined,
      });
    if (Array.isArray(fb.gaps) && fb.gaps.length)
      evidence.push({ label: "Gaps flagged", value: fb.gaps.length, detail: fb.gaps[0] });
    if (Array.isArray(fb.recommendations) && fb.recommendations.length)
      evidence.push({ label: "AI recommendations", value: fb.recommendations.length });
  }

  if (!resume?.content) {
    return metric(
      "resume",
      "Resume Score",
      0,
      GENERIC_LEVELS,
      evidence,
      "No resume saved yet — your Resume Score can't be computed.",
      "Save your resume and run an ATS match against a target job description.",
      "Paste your resume in the Resume Builder and score it."
    );
  }

  const why =
    ats != null
      ? `Your resume matches ${ats}/100 against your target${
          fb?.missingKeywords?.length ? ` — ${fb.missingKeywords.length} target keywords are missing` : ""
        }.`
      : `Your resume scores ${novaResume}/100 on section completeness — ${
          evidence.find((e) => e.label === "Sections detected")?.detail ?? "scan your sections"
        }.`;

  const how =
    fb?.missingKeywords?.length
      ? `Add the missing keywords your target roles scan for: ${fb.missingKeywords.slice(0, 4).join(", ")}.`
      : `Fill in the missing resume sections to raise completeness.`;

  const whatToImprove =
    (Array.isArray(fb?.recommendations) && fb.recommendations[0]) ||
    (Array.isArray(fb?.gaps) && fb.gaps[0]) ||
    (evidence.find((e) => e.label === "Sections detected")?.detail?.replace("missing: ", "add the ") + " section.") ||
    "Re-run an ATS match against a specific job description to surface concrete gaps.";

  return metric("resume", "Resume Score", score, GENERIC_LEVELS, evidence, why, how, String(whatToImprove));
}

const SUB_LABELS = {
  mockScore: "Mock score avg",
  communication: "Communication",
  technical: "Technical depth",
  structure: "Structure",
  quizAccuracy: "Quiz accuracy",
};
const SUB_ORDER = ["mockScore", "communication", "technical", "structure", "quizAccuracy"];

function assembleReadiness(readiness, topImprovement) {
  if (!readiness) {
    return metric(
      "interviewReadiness",
      "Interview Readiness",
      0,
      READINESS_SCORE_LEVELS,
      [],
      "No interview practice recorded yet — readiness can't be measured.",
      "Run a mock interview; it calibrates communication, technical depth, and structure.",
      "Start a mock interview in the Prep tab."
    );
  }
  const subs = readiness.subs || {};
  const subEvidence = SUB_ORDER.map((k) => ({
    label: SUB_LABELS[k],
    value: subs[k] ?? 0,
    detail: k === "mockScore" ? undefined : undefined,
  })).filter((e) => e.label);
  const evidence = [
    ...subEvidence,
    { label: "Sessions (recent)", value: subs.sessions ?? 0 },
    { label: "Trend", value: readiness.trend ?? "none" },
  ];

  const scored = SUB_ORDER.map((k) => ({ k, v: Number(subs[k]) || 0 })).filter((x) => x.v > 0);
  const weakest = scored.sort((a, b) => a.v - b.v)[0];

  const why = weakest
    ? `Readiness is ${readiness.score}/100 (${readiness.level}) — your lowest sub-metric is ${SUB_LABELS[weakest.k]} at ${weakest.v}/100.`
    : `Readiness is ${readiness.score}/100 based on ${subs.sessions ?? 0} recent session(s). Run a mock to get sub-metric detail.`;

  const how = weakest
    ? `Lift ${SUB_LABELS[weakest.k]} (${weakest.v} → 60+) — it's the fastest lever to the next tier.`
    : `Run 2–3 more mock interviews to populate your sub-metrics.`;

  const whatToImprove = topImprovement
    ? `Top fix from your feedback: ${topImprovement}.`
    : weakest
      ? `Run a mock focused on ${SUB_LABELS[weakest.k].toLowerCase()} — structure answers with STAR.`
      : "Run your first mock interview to calibrate readiness.";

  return metric(
    "interviewReadiness",
    "Interview Readiness",
    readiness.score,
    READINESS_SCORE_LEVELS,
    evidence,
    why,
    how,
    whatToImprove
  );
}

function startOfDayTs(ts) {
  return new Date(ts).setHours(0, 0, 0, 0);
}

function computeLearningVelocity({ sessions = [], topics = [], weeks = 8 }) {
  const now = Date.now();
  const weekMs = 7 * DAY_MS;
  const buckets = Array.from({ length: weeks }, () => 0);
  for (const s of sessions) {
    const ts = new Date(s?.createdAt).getTime();
    if (!Number.isFinite(ts)) continue;
    const weeksAgo = Math.floor((now - ts) / weekMs);
    if (weeksAgo >= 0 && weeksAgo < weeks) buckets[weeksAgo]++;
  }
  const chrono = [...buckets].reverse();
  const recentAvg = avg(chrono.slice(-4));
  const priorAvg = avg(chrono.slice(0, weeks - 4));
  const trend =
    chrono.filter(Boolean).length < 2
      ? "none"
      : recentAvg > priorAvg + 0.5
        ? "up"
        : recentAvg < priorAvg - 0.5
          ? "down"
          : "flat";

  const totalTopics = topics.length;
  const learnedCount = topics.filter((t) => t?.status === "learned").length;
  const inProgress = topics.filter((t) => t?.status === "learning" || t?.status === "needs_review").length;
  const masteryRate = totalTopics ? learnedCount / totalTopics : 0;

  const volumePart = Math.min(50, recentAvg * 12.5);
  const masteryPart = Math.min(30, masteryRate * 30);
  const trendPart = trend === "up" ? 20 : trend === "flat" ? 12 : trend === "down" ? 4 : 0;
  const score = clamp(volumePart + masteryPart + trendPart);

  const series = chrono.map((count, i) => {
    const date = new Date(now - (weeks - 1 - i) * weekMs);
    return { date: format(date, "dd MMM"), value: count };
  });

  const evidence = [
    { label: "Sessions this week", value: buckets[0] || 0 },
    { label: "Avg sessions/week (last 4w)", value: Number(recentAvg.toFixed(1)) },
    { label: "Trend (vs prior 4w)", value: trend },
    { label: "Topics learned", value: `${learnedCount}/${totalTopics}` },
    { label: "Topics in progress", value: inProgress },
  ];

  const why =
    sessions.length === 0
      ? "No learning sessions logged yet — velocity can't be measured."
      : trend === "up"
        ? `You've averaged ${recentAvg.toFixed(1)} sessions/week over the last 4 weeks, up from ${priorAvg.toFixed(1)} — momentum is building.`
        : trend === "down"
          ? `Your practice pace slowed: ${recentAvg.toFixed(1)}/week recently vs ${priorAvg.toFixed(1)} prior.`
          : `Steady ${recentAvg.toFixed(1)} sessions/week; ${learnedCount} of ${totalTopics} tracked topics mastered.`;

  const how =
    recentAvg < 2
      ? "Aim for 2+ learning sessions per week (quiz, mock, resource, or project)."
      : masteryRate < 0.3 && totalTopics
        ? "Mark tracked topics 'learned' as you master them — mastery lifts velocity more than raw volume."
        : "Maintain the weekly cadence and add one new tracked skill.";

  const whatToImprove =
    sessions.length === 0
      ? "Log your first learning session this week."
      : buckets[0] === 0
        ? "Log a session today to keep this week's count above zero."
        : trend === "down"
          ? "Reclaim your prior cadence — schedule 2 sessions this week."
          : `Mark your next in-progress topic learned to reach ${Math.min(totalTopics, learnedCount + 1)}/${totalTopics} mastery.`;

  return metric(
    "learningVelocity",
    "Learning Velocity",
    score,
    VELOCITY_LEVELS,
    evidence,
    why,
    how,
    whatToImprove,
    { series }
  );
}

const STAGE_WEIGHT = {
  SAVED: 0.05,
  APPLIED: 0.2,
  SCREENING: 0.4,
  INTERVIEW: 0.7,
  OFFER: 1.0,
  REJECTED: 0,
};
const STAGE_ORDER = ["SAVED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"];
const STAGE_LABEL = {
  SAVED: "Saved",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

function computeApplicationSuccessRate({ applications = [] }) {
  const total = applications.length;
  const byStatus = {};
  for (const a of applications) {
    const s = String(a?.status || "SAVED");
    byStatus[s] = (byStatus[s] || 0) + 1;
  }
  const offers = byStatus.OFFER || 0;
  const interviews = byStatus.INTERVIEW || 0;
  const rejections = byStatus.REJECTED || 0;

  const weightedSum = applications.reduce((s, a) => s + (STAGE_WEIGHT[String(a?.status)] ?? 0), 0);
  const rate = total ? (weightedSum / total) * 100 : 0;
  const score = clamp(rate * 0.8 + Math.min(20, total * 2));

  const furthestStage = STAGE_ORDER.reduce(
    (best, s) => ((byStatus[s] || 0) > 0 && STAGE_WEIGHT[s] > STAGE_WEIGHT[best] ? s : best),
    "SAVED"
  );
  const rejectionRate = total ? Math.round((rejections / total) * 100) : 0;

  const reasonCounts = {};
  for (const a of applications) {
    const r = a?.rejectionReason;
    if (r && String(r).trim()) {
      const key = String(r).trim();
      reasonCounts[key] = (reasonCounts[key] || 0) + 1;
    }
  }
  const topRejectionReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([reason]) => reason);

  const funnel = STAGE_ORDER.map((s) => ({ stage: STAGE_LABEL[s], count: byStatus[s] || 0 }));

  const evidence = [
    { label: "Total applications", value: total },
    { label: "Furthest stage reached", value: STAGE_LABEL[furthestStage] },
    { label: "Offers", value: offers },
    { label: "Interviews", value: interviews },
    { label: "Rejection rate", value: `${rejectionRate}%` },
    ...(topRejectionReasons.length
      ? [{ label: "Top rejection reason", value: topRejectionReasons[0] }]
      : []),
  ];

  if (total === 0) {
    return metric(
      "applicationSuccessRate",
      "Application Success Rate",
      0,
      APPLICATION_LEVELS,
      evidence,
      "No applications logged yet — your funnel is empty.",
      "Log applications as you send them, then advance their status as they progress.",
      "Add your first application in the Pipeline tab."
    );
  }

  const pastInterview = offers + interviews;
  const why =
    pastInterview > 0
      ? `${Math.round((pastInterview / total) * 100)}% of your applications have reached interview or beyond (${pastInterview}/${total}).`
      : `You have ${total} application(s) but none have reached interview yet — your funnel is front-loaded at ${STAGE_LABEL[furthestStage]}.`;

  const leakStage = STAGE_ORDER.slice(0, 4)
    .map((s) => ({ s, n: byStatus[s] || 0 }))
    .sort((a, b) => b.n - a.n)[0];

  const how =
    leakStage && leakStage.n > 0
      ? `${leakStage.n} application(s) are stuck at ${STAGE_LABEL[leakStage.s]} — advance or withdraw the stale ones.`
      : "Keep your funnel moving: follow up on applications older than 2 weeks.";

  const whatToImprove = topRejectionReasons.length
    ? `Address your top rejection reason — "${topRejectionReasons[0]}" — across future applications.`
    : pastInterview === 0
      ? "Tailor your resume + cover letter per role to lift applications into screening."
      : "Push one screening-stage application into an interview this week.";

  return metric(
    "applicationSuccessRate",
    "Application Success Rate",
    score,
    APPLICATION_LEVELS,
    evidence,
    why,
    how,
    whatToImprove,
    { funnel }
  );
}

function assembleSkillGrowth(growth, distinctSkills = 0) {
  if (!growth || !growth.series?.length) {
    return metric(
      "skillGrowth",
      "Skill Growth",
      0,
      GENERIC_LEVELS,
      [{ label: "Distinct skills practiced", value: distinctSkills }],
      "No quiz or mock history yet — skill growth can't be tracked.",
      "Take a quiz or run a mock interview to start the confidence trend.",
      "Complete one quiz this week to seed your growth curve."
    );
  }
  const { latest = 0, first = 0, trend, series } = growth;
  const delta = latest - first;
  const evidence = [
    { label: "Current confidence", value: `${latest}/100` },
    { label: "Starting confidence", value: `${first}/100` },
    { label: "Change", value: `${delta >= 0 ? "+" : ""}${delta}`, detail: trend },
    { label: "Trend", value: trend },
    { label: "Distinct skills practiced", value: distinctSkills },
  ];

  const why =
    trend === "up"
      ? `Your skill confidence climbed from ${first} → ${latest} (+${delta}) — your practice is paying off.`
      : trend === "down"
        ? `Skill confidence slipped from ${first} → ${latest} (${delta}) — recent practice scores are lower.`
        : trend === "flat"
          ? `Skill confidence is steady at ${latest} (started at ${first}) — plateaued.`
          : `Skill confidence sits at ${latest} from ${series.length} data point(s).`;

  const how =
    trend === "down"
      ? "Revisit weak topics — re-take quizzes on low-scoring categories."
      : trend === "flat"
        ? "Break the plateau: add a harder quiz or a mock interview to push past your current level."
        : "Keep the weekly practice cadence — consistency compounds the gains.";

  const whatToImprove =
    trend === "down"
      ? "Run a mock interview this week to diagnose where confidence dropped."
      : trend === "flat"
        ? "Add a quiz or mock this week to reverse the plateau."
        : "Move one in-progress tracked topic to 'learned' to lock in the gain.";

  return metric("skillGrowth", "Skill Growth", latest, GENERIC_LEVELS, evidence, why, how, whatToImprove, { series });
}

function computeConsistency({ streak = 0, lastActiveAt = null, activityDays = [] }) {
  const now = Date.now();
  const dayTsList = activityDays
    .map((d) => startOfDayTs(d))
    .filter((ts) => Number.isFinite(ts))
    .sort((a, b) => a - b);
  const distinctDays = Array.from(new Set(dayTsList));

  const cutoff28 = startOfDayTs(now - 28 * DAY_MS);
  const activeDaysLast28 = distinctDays.filter((ts) => ts >= cutoff28).length;

  let longestStreak = 0;
  let run = 0;
  let prevTs = null;
  for (const ts of distinctDays) {
    if (prevTs != null && ts - prevTs === DAY_MS) run += 1;
    else run = 1;
    longestStreak = Math.max(longestStreak, run);
    prevTs = ts;
  }

  const daysSinceLastActive = lastActiveAt
    ? Math.max(0, Math.floor((startOfDayTs(now) - startOfDayTs(lastActiveAt)) / DAY_MS))
    : null;

  const streakPart = Math.min(40, streak * 4);
  const cadencePart = Math.min(40, (activeDaysLast28 / 28) * 40);
  const recencyPart =
    daysSinceLastActive == null ? 0 : Math.max(0, 20 - daysSinceLastActive);
  const score = clamp(streakPart + cadencePart + recencyPart);

  const cadenceLabel =
    activeDaysLast28 >= 20 ? "daily-class" : activeDaysLast28 >= 10 ? "regular" : activeDaysLast28 >= 4 ? "occasional" : "rare";

  const evidence = [
    { label: "Current streak", value: `${streak} day${streak === 1 ? "" : "s"}` },
    { label: "Active days (last 28d)", value: `${activeDaysLast28}/28` },
    { label: "Longest streak", value: `${longestStreak} day${longestStreak === 1 ? "" : "s"}` },
    ...(daysSinceLastActive != null
      ? [{ label: "Days since last active", value: daysSinceLastActive }]
      : []),
    { label: "Cadence", value: cadenceLabel },
  ];

  const why =
    streak > 0
      ? `You're on a ${streak}-day streak with ${activeDaysLast28} active days in the last 4 weeks.`
      : `No active streak — you've shown up ${activeDaysLast28} of the last 28 days.`;

  const how =
    activeDaysLast28 < 10
      ? "Aim for daily reps — even one small action logs an active day and extends your streak."
      : "Maintain the cadence; protect your streak by logging one activity each day.";

  const whatToImprove =
    daysSinceLastActive == null
      ? "Log one activity today to start your streak."
      : daysSinceLastActive > 1
        ? "Log one activity today — your streak resets after a missed day."
        : "Log one activity today to extend your streak to " + (streak + 1) + " days.";

  return metric("consistency", "Consistency Score", score, CONSISTENCY_LEVELS, evidence, why, how, whatToImprove);
}

const COUNT_TO_EVENT = {
  resumes: "resume_saved",
  coverLetters: "cover_letter",
  quizzes: "quiz_completed",
  mocks: "mock_interview",
  applications: "application_logged",
  learningSessions: "learning_session",
  goals: "goal_set",
  memories: "memory_write",
};
const EVENT_XP = XP_BY_EVENT;

function computeProductivity({ xp = 0, eventCounts = {}, recentActivity = 0 }) {
  const entries = Object.entries(eventCounts)
    .map(([k, n]) => ({ event: COUNT_TO_EVENT[k] || k, count: Number(n) || 0 }))
    .filter((e) => e.count > 0);
  const distinctEventTypes = entries.length;
  const totalActivities = entries.reduce((s, e) => s + e.count, 0);

  const xpPart = Math.min(50, Number(xp) / 10);
  const recentPart = Math.min(30, recentActivity * 3);
  const breadthPart = Math.min(20, distinctEventTypes * 2.5);
  const score = clamp(xpPart + recentPart + breadthPart);

  const topTypes = entries.sort((a, b) => b.count - a.count).slice(0, 5);
  const xpByEventType = topTypes.map((e) => ({
    label: e.event,
    value: e.count,
  }));

  const allKeys = Object.keys(COUNT_TO_EVENT);
  const sparse = allKeys
    .filter((k) => !(eventCounts[k] && eventCounts[k] > 0))
    .map((k) => ({ event: COUNT_TO_EVENT[k], xp: EVENT_XP[COUNT_TO_EVENT[k]] || 5 }))
    .sort((a, b) => b.xp - a.xp);

  const evidence = [
    { label: "Total XP", value: xp },
    { label: "Activities this week", value: recentActivity },
    { label: "Activity types used", value: `${distinctEventTypes}/${allKeys.length}` },
    ...xpByEventType,
  ];

  const why =
    totalActivities === 0
      ? "No productive activity logged yet — your XP and breadth are zero."
      : `${xp} XP from ${totalActivities} activities across ${distinctEventTypes} type(s); ${recentActivity} this week.`;

  const how =
    distinctEventTypes < 4
      ? "Diversify your activity — each new type adds breadth points (up to +20)."
      : recentActivity < 5
        ? "Pick up the weekly volume — recent activity is the biggest mover here."
        : "Keep stacking XP; breadth and recency are both healthy.";

  const whatToImprove = sparse.length
    ? `No ${sparse[0].event.replace(/_/g, " ")} logged yet — each one is worth ${sparse[0].xp} XP. Start there.`
    : recentActivity === 0
      ? "Log one activity today to bank XP and protect your streak."
      : "Maintain the pace — you're covering all activity types.";

  return metric("productivity", "Productivity Score", score, GENERIC_LEVELS, evidence, why, how, whatToImprove);
}

const SIX_WEEKS_MS = 6 * 7 * DAY_MS;

export function computeIntelligence(input = {}) {
  const {
    resume,
    assessments = [],
    coverLetters = [],
    applications = [],
    mocks = [],
    userSkills = [],
    insights = null,
    learningTopics = [],
    learningSessions = [],
    memoryStats = { total: 0, byType: {} },
    user = { streak: 0, lastActiveAt: null, xp: 0 },
    timelineEvents = [],
    trends = {},
    eventCounts = {},
    recentActivity = 0,
    computedAt = null,
  } = input;

  const distinctSkills = new Set(
    (userSkills || []).map((s) => String(s).toLowerCase()).filter(Boolean)
  ).size;

  const sixWeeksAgo = new Date(Date.now() - SIX_WEEKS_MS);

  const nova = computeNovaScore({
    resume,
    assessments,
    coverLetters,
    applications,
    userSkills,
    insights,
  });
  const health = computeHealthScore({
    resume,
    assessments,
    coverLetters,
    applications,
    userSkills,
    insights,
    mocks,
    distinctSkills,
    memoryStats,
    learningTopics,
  });
  const readiness = computeInterviewReadiness({ mocks, assessments, since: sixWeeksAgo });
  const growth = computeSkillGrowth({ assessments, mocks });

  const timelineDays = timelineEvents
    .map((e) => new Date(e?.occurredAt).getTime())
    .filter((ts) => Number.isFinite(ts));

  return {
    computedAt,
    metrics: {
      careerHealth: assembleCareerHealth(health),
      resume: assembleResumeScore({ resume, novaBreakdown: nova.breakdown }),
      interviewReadiness: assembleReadiness(readiness, trends?.topImprovement),
      learningVelocity: computeLearningVelocity({ sessions: learningSessions, topics: learningTopics }),
      applicationSuccessRate: computeApplicationSuccessRate({ applications }),
      skillGrowth: assembleSkillGrowth(growth, distinctSkills),
      consistency: computeConsistency({
        streak: Number(user.streak) || 0,
        lastActiveAt: user.lastActiveAt,
        activityDays: timelineDays,
      }),
      productivity: computeProductivity({
        xp: Number(user.xp) || 0,
        eventCounts,
        recentActivity,
      }),
    },
  };
}

export { GENERIC_LEVELS as INTELLIGENCE_LEVELS };