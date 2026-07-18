/**
 * Prompt builders for the Gemini-powered features.
 *
 * Centralizing these keeps the prompt contract in one place and removes the
 * duplicate string literals that previously lived in actions/dashboard.js and
 * lib/inngest/function.js (the weekly cron and the on-demand generator must
 * use identical prompts so insights stay consistent).
 */

export const industryInsightsPrompt = (industry) => `
Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
{
  "salaryRanges": [
    { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
  ],
  "growthRate": number,
  "demandLevel": "High" | "Medium" | "Low",
  "topSkills": ["skill1", "skill2"],
  "marketOutlook": "Positive" | "Neutral" | "Negative",
  "keyTrends": ["trend1", "trend2"],
  "recommendedSkills": ["skill1", "skill2"]
}

IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
Include at least 5 common roles for salary ranges.
Growth rate should be a percentage.
Include at least 5 skills and trends.
`;

export const quizPrompt = (industry, skills = []) => `
Generate 10 technical interview questions for a ${industry} professional${
  skills.length ? ` with expertise in ${skills.join(", ")}` : ""
}.

Each question should be multiple choice with 4 options.

Return the response in this JSON format only, no additional text:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}
`;

export const coverLetterPrompt = (user, data) => `
Write a professional cover letter for a ${data.jobTitle} position at ${data.companyName}.

About the candidate:
- Industry: ${user.industry}
- Years of Experience: ${user.experience}
- Skills: ${user.skills?.join(", ") ?? "n/a"}
- Professional Background: ${user.bio ?? "n/a"}

Job Description:
${data.jobDescription}

Requirements:
1. Use a professional, enthusiastic tone
2. Highlight relevant skills and experience
3. Show understanding of the company's needs
4. Keep it concise (max 400 words)
5. Use proper business letter formatting in markdown
6. Include specific examples of achievements
7. Relate candidate's background to job requirements

Format the letter in markdown.
`;

export const improveEntryPrompt = (industry, type, current) => `
As an expert resume writer, improve the following ${type} description for a ${industry} professional.
Make it more impactful, quantifiable, and aligned with industry standards.
Current content: "${current}"

Requirements:
1. Use action verbs
2. Include metrics and results where possible
3. Highlight relevant technical skills
4. Keep it concise but detailed
5. Focus on achievements over responsibilities
6. Use industry-specific keywords

Format the response as a single paragraph without any additional text or explanations.
`;

export const improvementTipPrompt = (industry, wrongQuestionsText) => `
The user got the following ${industry} technical interview questions wrong:

${wrongQuestionsText}

Based on these mistakes, provide a concise, specific improvement tip.
Focus on the knowledge gaps revealed by these wrong answers.
Keep the response under 2 sentences and make it encouraging.
Don't explicitly mention the mistakes, instead focus on what to learn/practice.
`;

/**
 * ATS match — score a resume against a job description. Returns structured JSON
 * the application tracker persists (Application.atsScore / atsFeedback).
 */
export const atsMatchPrompt = (resumeContent, jobDescription) => `
You are an expert ATS (Applicant Tracking System) reviewer. Compare the
candidate's resume against the job description and assess fit.

RESUME:
${resumeContent}

JOB DESCRIPTION:
${jobDescription}

Return ONLY this JSON, no other text:
{
  "score": number,             // 0-100 overall match score
  "matchedKeywords": ["string"], // keywords/skills present in BOTH
  "missingKeywords": ["string"], // keywords/skills in the JD but absent from resume
  "strengths": ["string"],     // 2-4 short bullets on what fits well
  "gaps": ["string"],          // 2-4 short bullets on what's missing/weak
  "recommendations": ["string"] // 3-5 specific, actionable resume edits to raise the score
}
`;

/**
 * Voice mock-interview interviewer persona. Generates the next question given
 * the role, the candidate's resume context, and the conversation so far.
 */
export const mockInterviewQuestionPrompt = (role, industry, transcriptSoFar) => `
You are a senior interviewer conducting a ${role}${
  industry ? ` at a ${industry} company` : ""
} mock interview. Ask ONE clear interview question at a time.

Conversation so far:
${transcriptSoFar || "(just starting)"}

Rules:
- Ask exactly ONE question, natural and conversational.
- Mix behavioral and technical/role-specific questions.
- Build on the candidate's previous answers when relevant.
- Keep it under 3 sentences. Do not include any preamble or label.
Output only the question.
`;

/**
 * End-of-session scoring for a mock interview transcript.
 */
export const mockInterviewScorePrompt = (role, industry, transcript) => `
You are a senior interviewer. Review this ${role}${
  industry ? ` (${industry})` : ""
} mock interview transcript and score the candidate.

TRANSCRIPT:
${transcript}

Return ONLY this JSON, no other text:
{
  "score": number,            // 0-100 overall
  "communication": number,    // 0-100
  "technicalDepth": number,   // 0-100
  "structure": number,        // 0-100 (e.g. STAR usage)
  "strengths": ["string"],    // 2-3 bullets
  "improvements": ["string"]  // 3-4 specific actionable bullets
}
`;

/**
 * Rewrite a raw resume bullet into a quantified, impact-led achievement using
 * the STAR / XYZ framework.
 */
export const rewriteAchievementPrompt = (industry, rawBullet) => `
Rewrite this resume bullet for a ${industry} professional into a strong,
quantified achievement statement using the XYZ framework ("Accomplished [X] as
measured by [Y], by doing [Z]"). Invent realistic but plausible metrics only if
the original clearly implies them; otherwise keep it concrete without fake
numbers. Return 3 alternative one-line bullets, one per line, no numbering or
preamble.

Raw bullet: "${rawBullet}"
`;

/**
 * A week-by-week upskilling roadmap toward a target role.
 */
export const skillRoadmapPrompt = (currentSkills, targetRole, weeks = 8) => `
You are a career coach. Design a ${weeks}-week upskilling roadmap for someone
whose current skills are: ${currentSkills || "none listed"}, targeting the
role: ${targetRole}.

Return ONLY this JSON, no other text:
{
  "targetRole": "string",
  "summary": "string",
  "weeks": [
    {
      "week": number,
      "focus": "string",
      "skills": ["string"],
      "actions": ["string"],
      "resources": [{"name": "string", "type": "course|book|project|article"}]
    }
  ]
}
`;

/**
 * A short cold-outreach message (LinkedIn note / recruiter email) tailored to
 * a target company and the candidate's background.
 */
export const outreachMessagePrompt = (user, targetCompany, targetRole, kind = "linkedin") => `
Write a concise, professional cold ${kind === "email" ? "email" : "LinkedIn connection note"}
to a ${targetRole} at ${targetCompany}.

Candidate background:
- Industry: ${user.industry}
- Experience: ${user.experience} years
- Skills: ${user.skills?.join(", ") ?? "n/a"}
- Bio: ${user.bio ?? "n/a"}

Rules:
- ${kind === "email" ? "6-10 sentences" : "Under 300 characters (LinkedIn note limit)"}
- Specific, not generic; reference the company.
- End with a soft, clear ask.
Return only the message, no preamble.
`;

/**
 * Job-fit score + emphasis for a cover letter given resume + JD.
 */
export const jobFitPrompt = (user, jobDescription) => `
Score how well this candidate fits this job description, and list what to
emphasize in a cover letter.

Candidate:
- Industry: ${user.industry}
- Experience: ${user.experience} years
- Skills: ${user.skills?.join(", ") ?? "n/a"}
- Bio: ${user.bio ?? "n/a"}

Job description:
${jobDescription}

Return ONLY this JSON, no other text:
{
  "fitScore": number,            // 0-100
  "matchReasons": ["string"],    // 2-4 reasons the candidate fits
  "emphasize": ["string"],       // 2-4 things to highlight in a cover letter
  "addressGaps": ["string"]      // 1-2 ways to frame weaker areas
}
`;

/**
 * Weekly career digest for a user — synthesizes their industry insights, recent
 * activity, and a practice prompt into a Monday-morning brief.
 */
export const weeklyDigestPrompt = (user, insights, recentActivity) => `
You are a career coach writing a concise, motivating Monday brief for a
${user.industry} professional with ${user.experience ?? "some"} years of
experience.

Their market insights (may be recent):
${JSON.stringify(insights ?? {})}

Their recent activity (last week):
${recentActivity || "No recorded activity this week."}

Return ONLY this JSON, no other text:
{
  "headline": "string",            // one-line theme for the week
  "marketPulse": "string",         // 1-2 sentences on the market this week
  "skillToWatch": "string",        // one skill trending up worth learning
  "practiceQuestion": "string",   // one interview question to practice
  "resumeTip": "string",           // one concrete resume tweak
  "actionItem": "string"           // one concrete job-search action this week
}
`;