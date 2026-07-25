import { ensureOnboarded } from "@/lib/onboarding";
import { listRepos } from "@/actions/github";
import { PageHeader } from "@/components/site/page-header";
import GitHubAnalyzer from "./_components/github-analyzer";

export const metadata = { title: "GitHub Project Analyzer" };

export default async function GitHubPage() {
  await ensureOnboarded();
  const repos = await listRepos();

  return (
    <div className="container mx-auto">
      <PageHeader
        eyebrow="Career OS"
        title="GitHub Project Analyzer"
        description="Connect a repository and get a senior-engineer review across architecture, security, performance, documentation, testing, and scalability — grounded in your actual code."
      />
      <GitHubAnalyzer initialRepos={repos} />
    </div>
  );
}