/**
 * GitHub API fetcher (M7) — gathers the repository payload the Senior-Engineer
 * review prompt needs: metadata, the recursive file tree, the README, and a
 * sampled set of key source files.
 *
 * Auth: an optional Personal Access Token is passed via the `pat` arg. When
 * provided it is sent as a Bearer header for higher rate limits + private-repo
 * access; the caller (Inngest job) discards the PAT after this call — it is
 * NEVER persisted (only its sha256 lives on GitHubRepo.patHash). Public repos
 * work with `pat = null` (unauthenticated, 60 req/hr shared limit).
 *
 * Server-only.
 */

const API = "https://api.github.com";

const SOURCE_EXTS = [
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rs", ".rb",
  ".php", ".c", ".cc", ".cpp", ".h", ".cs", ".kt", ".swift", ".scala",
  ".vue", ".svelte",
];
const KEY_FILES = new Set([
  "package.json",
  "tsconfig.json",
  "go.mod",
  "Cargo.toml",
  "requirements.txt",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "Gemfile",
  "composer.json",
  "Dockerfile",
  "docker-compose.yml",
  "readme.md",
  "contributing.md",
  "license",
]);

const MAX_FILES = 12;
const MAX_FILE_BYTES = 1800;

function headers(pat) {
  const h = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "NovaNest-AI",
  };
  if (pat) h.Authorization = `Bearer ${pat}`;
  return h;
}

async function gh(path, pat) {
  const res = await fetch(`${API}${path}`, { headers: headers(pat) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${path} → ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function decodeBase64(b64) {
  try {
    // Node 18+ Buffer handles GitHub's base64 (incl. newlines).
    return Buffer.from(String(b64).replace(/\n/g, ""), "base64").toString("utf8");
  } catch {
    return "";
  }
}

/**
 * Pick a representative sample of file paths from the tree: always key config
 * files, then a handful of source files (small-medium, not vendored).
 */
function pickSampleFiles(tree) {
  const blobs = (tree || []).filter((t) => t.type === "blob" && t.path);
  const chosen = new Map();
  for (const b of blobs) {
    const base = b.path.split("/").pop().toLowerCase();
    if (KEY_FILES.has(base)) {
      chosen.set(b.path, b);
      continue;
    }
    if (chosen.size >= MAX_FILES) break;
    if (b.size && (b.size > 60_000 || b.size < 40)) continue; // skip huge / tiny
    if (/node_modules|vendor|dist|build|\.min\.|lock\b/i.test(b.path)) continue;
    if (SOURCE_EXTS.some((ext) => b.path.toLowerCase().endsWith(ext))) {
      chosen.set(b.path, b);
    }
  }
  return Array.from(chosen.values()).slice(0, MAX_FILES);
}

/**
 * Fetch the full repo payload for the Senior-Engineer review.
 * @param {{ fullName: string, pat?: string|null }} opts
 */
export async function fetchRepoPayload({ fullName, pat = null }) {
  const [owner, repo] = String(fullName).split("/");
  if (!owner || !repo) throw new Error("Invalid repo fullName (expected owner/repo).");

  // 1. Repo metadata.
  const meta = await gh(`/repos/${owner}/${repo}`, pat);
  const branch = meta.default_branch || "main";

  // 2. Recursive file tree (best-effort — a huge repo may truncate).
  let tree = [];
  try {
    const treeRes = await gh(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      pat
    );
    tree = Array.isArray(treeRes?.tree) ? treeRes.tree : [];
  } catch (e) {
    console.error("[NovaNest] github tree fetch failed:", e?.message);
  }

  // 3. README (best-effort).
  let readme = "";
  try {
    const r = await gh(`/repos/${owner}/${repo}/readme`, pat);
    readme = r?.content ? decodeBase64(r.content) : "";
  } catch {
    readme = "";
  }

  // 4. Sampled file contents (best-effort, parallel, per-file resilient).
  const samples = pickSampleFiles(tree);
  const files = [];
  await Promise.all(
    samples.map(async (s) => {
      try {
        // /contents/{path} returns { content, encoding } for files.
        const enc = encodeURIComponent(s.path);
        const c = await gh(
          `/repos/${owner}/${repo}/contents/${enc}?ref=${encodeURIComponent(branch)}`,
          pat
        );
        if (c && c.encoding === "base64" && c.content) {
          files.push({ path: s.path, content: decodeBase64(c.content).slice(0, MAX_FILE_BYTES) });
        }
      } catch {
        // one file failing shouldn't abort the analysis
      }
    })
  );

  return {
    fullName: meta.full_name || `${owner}/${repo}`,
    description: meta.description || null,
    language: meta.language || null,
    defaultBranch: branch,
    stars: meta.stargazers_count ?? null,
    isPrivate: !!meta.private,
    tree: tree.map((t) => t.path).filter(Boolean),
    readme,
    files,
  };
}