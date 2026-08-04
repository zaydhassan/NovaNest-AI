
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
    return Buffer.from(String(b64).replace(/\n/g, ""), "base64").toString("utf8");
  } catch {
    return "";
  }
}

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
    if (b.size && (b.size > 60_000 || b.size < 40)) continue;
    if (/node_modules|vendor|dist|build|\.min\.|lock\b/i.test(b.path)) continue;
    if (SOURCE_EXTS.some((ext) => b.path.toLowerCase().endsWith(ext))) {
      chosen.set(b.path, b);
    }
  }
  return Array.from(chosen.values()).slice(0, MAX_FILES);
}

export async function fetchRepoPayload({ fullName, pat = null }) {
  const [owner, repo] = String(fullName).split("/");
  if (!owner || !repo) throw new Error("Invalid repo fullName (expected owner/repo).");

  const meta = await gh(`/repos/${owner}/${repo}`, pat);
  const branch = meta.default_branch || "main";

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

  let readme = "";
  try {
    const r = await gh(`/repos/${owner}/${repo}/readme`, pat);
    readme = r?.content ? decodeBase64(r.content) : "";
  } catch {
    readme = "";
  }

  const samples = pickSampleFiles(tree);
  const files = [];
  await Promise.all(
    samples.map(async (s) => {
      try {
        const enc = encodeURIComponent(s.path);
        const c = await gh(
          `/repos/${owner}/${repo}/contents/${enc}?ref=${encodeURIComponent(branch)}`,
          pat
        );
        if (c && c.encoding === "base64" && c.content) {
          files.push({ path: s.path, content: decodeBase64(c.content).slice(0, MAX_FILE_BYTES) });
        }
      } catch {
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