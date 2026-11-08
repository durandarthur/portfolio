// Techs window data. Each tech's tag ("where I used it"), "since" year,
// "used in" list and "paired with" list are derived from CONTEXTS below,
// so they only state what the timeline and projects already say.
// Text lives in i18n.js under "Techs" (and the timeline / project keys).

// Places a tech was used. Tag order = display priority.
export const TAGS = ["work", "internship", "side", "gapyear", "school", "learning"];

export const CONTEXTS = {
	kalisio: { tag: "work", name: "Kalisio", since: 2025, period: "2025–26", textKey: "Data.timeline.kalisioDetail" },
	fuvi: { tag: "work", name: "Fuvi Clan", since: 2023, period: "2023–24", textKey: "Data.timeline.fuviDetail" },
	creapli: { tag: "internship", name: "Creapli", since: 2021, period: "2021", textKey: "Data.timeline.creapliDetail" },
	stlounge: { tag: "side", name: "stlounge", project: true, textKey: "Projects.stlounge.desc", link: { href: "https://github.com/durandarthur/stlounge", label: "github" } },
	ffrework: { tag: "side", nameKey: "App.ffReworkTitle", project: true, textKey: "Projects.ffrework.desc", link: { href: "https://demo.fanfiction-rework.com/", label: "demo" } },
	portfolio: { tag: "side", name: "portfolio", project: true, since: 2023, textKey: "Projects.portfolio.desc", link: { href: "https://github.com/durandarthur/portfolio", label: "github" } },
	gapyear: { tag: "gapyear", nameKey: "Data.timeline.personalProject", since: 2021, period: "2021–22", textKey: "Data.timeline.personalProjectDetail" },
	oclock: { tag: "school", name: "O'clock", since: 2022, period: "2022–24", textKey: "Data.timeline.oclockDetail" },
	cesi: { tag: "school", name: "CESI", since: 2019, period: "2019–21", textKey: "Data.timeline.cesiDetail" }
};

// Category key -> techs. `used` lists CONTEXTS keys; empty means unknown yet.
export const CATEGORIES = [
	{ key: "languages", techs: [
		{ name: "C#", used: ["creapli"] },
		{ name: "C++", used: ["stlounge", "cesi"] },
		{ name: "C", used: ["cesi"] },
		{ name: "JavaScript", used: ["kalisio", "fuvi", "creapli", "portfolio", "ffrework", "gapyear", "oclock", "cesi"] },
		{ name: "TypeScript", used: ["ffrework", "gapyear", "fuvi"] },
		{ name: "PHP", used: ["fuvi", "oclock", "cesi"] },
		{ name: "Python", used: ["fuvi", "gapyear", "cesi"] }
	] },
	{ key: "frontend", techs: [
		{ name: "Vue", used: ["kalisio", "fuvi", "portfolio", "oclock"] },
		{ name: "React", used: ["ffrework", "gapyear", "oclock"] },
		{ name: "Next.js", used: ["gapyear"] },
		{ name: "Quasar", used: ["kalisio"] },
		{ name: "Flutter", used: ["oclock"] },
		{ name: "Tailwind", used: ["portfolio", "gapyear", "fuvi"] },
		{ name: "Mantine UI", used: ["ffrework"] },
		{ name: "Material UI", used: ["gapyear"] },
		{ name: "Bootstrap", used: ["cesi"] },
		{ name: "SASS · PostCSS", used: ["creapli"] },
		{ name: "GSAP", used: ["portfolio"] },
	] },
	{ key: "backend", techs: [
		{ name: "Node.js", used: ["kalisio", "oclock"] },
		{ name: "Feathers.js", used: ["kalisio"] },
		{ name: "Laravel", used: ["fuvi"] },
		{ name: "Adonis.js", used: ["ffrework"] },
		{ name: "Express.js", used: ["gapyear"] },
		{ name: "Prisma · Knex.js", used: ["gapyear"] },
		{ name: "GraphQL", used: ["gapyear"] },
		{ name: "WebSockets", used: ["ffrework", "kalisio"] },
	] },
	{ key: "databases", techs: [
		{ name: "PostgreSQL", used: ["ffrework", "gapyear"] },
		{ name: "MySQL · MariaDB", used: ["creapli", "cesi", "fuvi"] },
		{ name: "SQL Server", used: ["creapli"] },
		{ name: "MongoDB", used: ["kalisio"] },
	] },
	{ key: "ai", techs: [
		{ name: "Llama.cpp", used: [] },
		{ name: "Claude Code", used: ["stlounge", "portfolio"] }
	] },
	{ key: "graphics", techs: [
		{ name: "OpenGL ES 3.0 · EGL", used: ["stlounge"] },
		{ name: "GLSL", used: ["stlounge"] },
		{ name: "SDL · Dear ImGui", used: ["stlounge"] },
		{ name: "three.js", used: ["portfolio"] },
	] },
	{ key: "devops", techs: [
		{ name: "Docker", used: ["ffrework", "gapyear", "oclock"] },
		{ name: "nginx", used: ["ffrework", "gapyear"] },
		{ name: "GitHub Actions", used: ["stlounge"] },
		{ name: "AWS (S3 · SQS · SNS)", used: ["fuvi"] },
		{ name: "Cloudflare", used: ["ffrework"] },
		{ name: "Vercel · Netlify", used: ["gapyear"] },
	] },
	{ key: "testing", techs: [
		{ name: "Puppeteer", used: ["kalisio"] },
		{ name: "Jest", used: ["kalisio"] },
		{ name: "Mocha", used: ["kalisio"] },
		{ name: "Cypress", used: ["oclock"] },
	] },
	{ key: "tooling", techs: [
		{ name: "Git", used: ["kalisio", "fuvi", "stlounge", "ffrework", "portfolio", "gapyear", "oclock", "cesi"] },
		{ name: "Vite", used: ["portfolio", "kalisio", "fuvi", "gapyear"] },
		{ name: "ESLint · Prettier", used: ["ffrework", "portfolio", "gapyear"] },
		{ name: "VS Code", used: ["kalisio", "fuvi", "stlounge", "ffrework", "portfolio", "gapyear", "oclock"] },
		{ name: "Postman", used: ["oclock", "gapyear", "ffrework"] },
		{ name: "SVN", used: ["creapli"] },
	] },
	{ key: "workflow", techs: [
		{ name: "Agile", used: ["kalisio", "oclock"] },
		{ name: "Figma", used: ["oclock"] },
		{ name: "Adobe XD · Photoshop · Illustrator", used: ["gapyear"] },
		{ name: "Trello", used: ["oclock"] },
		{ name: "GitHub Projects", used: ["kalisio", "ffrework"] },
		{ name: "GanttProject", used: ["cesi"] },
	] },
	{ key: "systems", techs: [
		{ name: "Linux", used: ["kalisio", "stlounge", "ffrework", "portfolio", "gapyear", "cesi"] },
		{ name: "Windows · WSL2", used: ["portfolio", "gapyear"] },
		{ name: "macOS", used: ["fuvi"] },
		{ name: "VirtualBox", used: ["cesi", "gapyear"] },
	] },
	{ key: "other", techs: [
		{ name: "Premiere Pro", used: [] },
		{ name: "FL Studio", used: [] },
		{ name: "OBS", used: [] },
		{ name: "Obsidian", used: [] },
		{ name: "Excel · PowerPoint · Access", used: [] },
	] },
];

// Tech-specific lines for a context, replacing the context's summary
export const NOTES = {
	"OpenGL ES 3.0 · EGL": { stlounge: "Techs.notes.openglStlounge" },
};

export const DEFAULT_OPEN = ["languages", "graphics"];
export const DEFAULT_SELECTED = "OpenGL ES 3.0 · EGL";

// ── Derived ──────────────────────────────────────────────────────
const allTechs = CATEGORIES.flatMap((cat) =>
	cat.techs.map((tech) => ({ ...tech, category: cat.key }))
);
export const techByName = (name) => allTechs.find((t) => t.name === name);

// Highest-priority tag among the places it was used. No documented
// place means a side project.
export function tagOf(tech) {
	const tags = tech.used.map((key) => CONTEXTS[key].tag);
	return TAGS.find((tag) => tags.includes(tag)) ?? "side";
}

// Only used in projects that also used Claude Code (AI-assisted)
export function aiOnly(tech) {
	const aiContexts = techByName("Claude Code")?.used ?? [];
	return tech.used.length > 0 && tech.used.every((key) => aiContexts.includes(key));
}

// Earliest known year, or null
export function sinceOf(tech) {
	const years = tech.used.map((key) => CONTEXTS[key].since).filter(Boolean);
	return years.length ? Math.min(...years) : null;
}

// Techs sharing the most contexts with this one
export function pairedWith(tech, limit = 4) {
	return allTechs
		.filter((other) => other.name !== tech.name)
		.map((other) => ({
			tech: other,
			shared: other.used.filter((key) => tech.used.includes(key)).length,
		}))
		.filter((p) => p.shared > 0)
		.sort((a, b) => b.shared - a.shared)
		.slice(0, limit)
		.map((p) => p.tech);
}
