
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

export const quizPrompt = (industry, skills = [], company = null) => {
  let s = `
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
  if (company) {
    s += `Tailor these questions for interviews at ${company.displayName} — reflect its known themes and values${
      company.values?.length ? ` (e.g. ${company.values.slice(0, 3).join(", ")})` : ""
    }.
`;
  }
  return s;
};

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

export const improvementTipPrompt = (industry, wrongQuestionsText, company = null) => {
  const prefix = company
    ? `The user is preparing for interviews at ${company.displayName}. Frame the tip toward its hiring bar and values.\n\n`
    : "";
  return prefix + `
The user got the following ${industry} technical interview questions wrong:

${wrongQuestionsText}

Based on these mistakes, provide a concise, specific improvement tip.
Focus on the knowledge gaps revealed by these wrong answers.
Keep the response under 2 sentences and make it encouraging.
Don't explicitly mention the mistakes, instead focus on what to learn/practice.
`;
};

export const atsMatchPrompt = (resumeContent, jobDescription, company = null) => {
  let s = `
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
  if (company) {
    s += `
COMPANY CONTEXT — ${company.displayName}
Hiring bar: ${company.bar || "unspecified"}
Values: ${(company.values || []).join(", ") || "unspecified"}
Top skills expected: ${(company.topSkills || []).join(", ") || "unspecified"}
Recommended skills: ${(company.recommendedSkills || []).join(", ") || "unspecified"}

Weight your "recommendations" toward closing the gaps that matter most at ${company.displayName}, and call out where the resume already reflects its values.
`;
  }
  return s;
};

export const mockInterviewQuestionPrompt = (role, industry, transcriptSoFar, company = null) => {
  let s = `
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
  if (company) {
    const themes = Array.isArray(company.interviewThemes) ? company.interviewThemes : [];
    const themesText = themes.length
      ? themes
          .map((t) => `- ${t.round || "Round"}: ${t.focus || ""}${t.examples?.length ? ` (e.g. ${t.examples.slice(0, 2).join("; ")})` : ""}`)
          .join("\n")
      : "";
    const famous = (company.famousQuestions || []).slice(0, 5);
    s += `
This interview is for a role at ${company.displayName}. Lean into its known interview focus and values${company.values?.length ? ` (${company.values.slice(0, 3).join(", ")})` : ""}.
${themesText ? `Known interview themes:\n${themesText}\n` : ""}${famous.length ? `Signature questions to emulate the spirit of:\n- ${famous.join("\n- ")}\n` : ""}
`;
  }
  return s;
};

export const mockInterviewScorePrompt = (role, industry, transcript, company = null) => {
  let s = `
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
  if (company) {
    s += `
This interview targets a role at ${company.displayName}. Score against its hiring bar and values${company.values?.length ? `: ${company.values.join(", ")}` : ""}.
Add an additive field "companyFit": number (0-100) reflecting alignment with ${company.displayName}'s bar and values.
`;
  }
  return s;
};

export const rewriteAchievementPrompt = (industry, rawBullet) => `
Rewrite this resume bullet for a ${industry} professional into a strong,
quantified achievement statement using the XYZ framework ("Accomplished [X] as
measured by [Y], by doing [Z]"). Invent realistic but plausible metrics only if
the original clearly implies them; otherwise keep it concrete without fake
numbers. Return 3 alternative one-line bullets, one per line, no numbering or
preamble.

Raw bullet: "${rawBullet}"
`;

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

export const companyProfilePrompt = (slug, displayName) => `
Analyze ${displayName} as an employer for software/tech talent and provide company-grained insights in ONLY the following JSON format without any additional notes or explanations:
{
  "salaryRanges": [
    { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
  ],
  "topSkills": ["skill1", "skill2"],
  "recommendedSkills": ["skill1", "skill2"],
  "interviewThemes": [
    { "round": "string", "focus": "string", "examples": ["string"] }
  ],
  "famousQuestions": ["string"],
  "values": ["string"],
  "bar": "string",
  "keyTrends": ["string"]
}

IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
- Include at least 5 common roles for salary ranges (realistic US levels bands).
- topSkills = the skills ${displayName} explicitly hires for / weighs heavily.
- recommendedSkills = skills a candidate should add to be competitive there.
- interviewThemes = the documented interview structure at ${displayName} (e.g. system design, leadership, coding rounds) with 1-2 example questions each.
- famousQuestions = well-known questions associated with ${displayName}'s process.
- values = the company's published cultural tenets (e.g. "Customer obsession").
- bar = one sentence summarizing the hiring bar at ${displayName}.
- keyTrends = what's changing at ${displayName} right now (hiring, tech, strategy).
Base every field on widely-known public information; never invent specific numbers as fact — use realistic representative ranges where exact figures are unknown.
`;

export const dreamCompanyPlanPrompt = (userProfile, companyProfile) => `
You are a senior career strategist + former ${companyProfile.displayName} hiring committee member. Build a personalized plan for this candidate to land a role at ${companyProfile.displayName}. Every single recommendation MUST include a "why" grounded in BOTH the candidate's background AND ${companyProfile.displayName}'s hiring bar and values.

CANDIDATE:
- Industry: ${userProfile.industry ?? "unspecified"}
- Experience: ${userProfile.experience ?? "unspecified"} years
- Skills: ${(userProfile.skills || []).join(", ") || "none listed"}
- Bio: ${userProfile.bio ?? "n/a"}
- Active goal: ${userProfile.activeGoal ? `${userProfile.activeGoal.targetRole}${userProfile.activeGoal.targetLevel ? ` (${userProfile.activeGoal.targetLevel})` : ""}${userProfile.activeGoal.timeframe ? ` within ${userProfile.activeGoal.timeframe}` : ""}` : "none set"}
- Recent mock-interview weaknesses: ${(userProfile.recentMockWeaknesses || []).join(", ") || "none recorded"}

COMPANY — ${companyProfile.displayName}
- Hiring bar: ${companyProfile.bar ?? "unspecified"}
- Values: ${(companyProfile.values || []).join(", ") || "unspecified"}
- Top skills: ${(companyProfile.topSkills || []).join(", ") || "unspecified"}
- Recommended skills: ${(companyProfile.recommendedSkills || []).join(", ") || "unspecified"}
- Interview themes: ${JSON.stringify(companyProfile.interviewThemes ?? [])}
- Signature questions: ${(companyProfile.famousQuestions || []).join(" | ") || "unspecified"}

Return ONLY this JSON, no other text:
{
  "interviewQuestions": [
    { "question": "string", "theme": "string", "why": "string" }
  ],
  "learningRoadmap": [
    { "skill": "string", "week": number, "focus": "string", "actions": ["string"], "why": "string" }
  ],
  "recommendedProjects": [
    { "title": "string", "description": "string", "skills": ["string"], "why": "string" }
  ],
  "resumeOptimization": [
    { "area": "string", "suggestion": "string", "why": "string" }
  ],
  "skillGaps": [
    { "skill": "string", "currentLevel": "string", "targetLevel": "string", "why": "string", "priority": "high" | "med" | "low" }
  ],
  "applicationStrategy": [
    { "step": number, "action": "string", "why": "string" }
  ]
}

Rules:
- 6-8 interviewQuestions, each mapped to a real ${companyProfile.displayName} interview theme.
- learningRoadmap: 6-8 weeks, ordered by week, building toward ${companyProfile.displayName}'s bar.
- 3-5 recommendedProjects that would impress ${companyProfile.displayName} specifically.
- 4-6 resumeOptimization areas, each tied to what ${companyProfile.displayName} screeners look for.
- skillGaps: each with a honest currentLevel + targetLevel + priority; "why" must reference the company's expectations.
- applicationStrategy: 4-6 ordered steps (referral, resume tailoring, prep, apply, follow-up), each "why" specific to ${companyProfile.displayName}.
- Every "why" must be a concrete sentence, not generic filler.
`;