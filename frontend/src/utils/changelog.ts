// Changelog loader. Reads every .md file from src/data/changelog at build time
// (Vite's import.meta.glob with eager + raw), parses YAML-ish frontmatter, and
// returns entries sorted by semantic version, newest first.
//
// To add a release: drop a new file `<version>.md` into src/data/changelog/.
// Frontmatter must include version + date + title.
// Body is rendered via the small in-house markdown renderer (MarkdownLite).

export interface ChangelogEntry {
  version: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  body: string;
}

const modules = import.meta.glob('../data/changelog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): ChangelogEntry {
  const match = raw.match(/^---\s*\n([\s\S]+?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Changelog entry is missing YAML frontmatter');
  }
  const [, fmBlock, body] = match;

  const fm: Record<string, string> = {};
  for (const line of fmBlock.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    if (key) fm[key] = value;
  }

  if (!fm.version || !fm.date || !fm.title) {
    throw new Error(
      `Changelog entry missing required fields (version, date, title): got ${JSON.stringify(fm)}`,
    );
  }

  return {
    version: fm.version,
    date: fm.date,
    title: fm.title,
    body: body.trim(),
  };
}

const compareVersionDesc = (a: string, b: string): number => {
  const aParts = a.split('.').map((n) => Number(n) || 0);
  const bParts = b.split('.').map((n) => Number(n) || 0);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const diff = (bParts[i] ?? 0) - (aParts[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

export const changelog: ChangelogEntry[] = Object.values(modules)
  .map((raw) => parseFrontmatter(raw))
  .sort((a, b) => compareVersionDesc(a.version, b.version));

export const latestVersion = changelog[0]?.version ?? '';
