// Techs window data. Each tech's tag ("where I used it"), "since" year,
// "used in" list and "paired with" list are derived from CONTEXTS below,
// so they only state what the timeline and projects already say.
// Text lives in i18n.js under "Techs" (and the timeline / project keys).

// Places a tech was used. Tag order = display priority.
export const TAGS = ["work", "internship", "side", "school", "learning"];

export const CONTEXTS = {
	kalisio: { tag: "work", name: "Kalisio", since: 2025, period: "2025–26", textKey: "Data.timeline.kalisioDetail" },
	fuvi: { tag: "work", name: "Fuvi Clan", since: 2023, period: "2023–24", textKey: "Data.timeline.fuviDetail" },
	creapli: { tag: "internship", name: "Creapli", since: 2021, period: "2021", textKey: "Data.timeline.creapliDetail" },
	stlounge: { tag: "side", name: "stlounge", project: true, textKey: "Projects.stlounge.desc", link: { href: "https://github.com/durandarthur/stlounge", label: "github" } },
	ffrework: { tag: "side", nameKey: "App.ffReworkTitle", project: true, textKey: "Projects.ffrework.desc", link: { href: "https://demo.fanfiction-rework.com/", label: "demo" } },
	portfolio: { tag: "side", name: "arthur-os", project: true, since: 2023, textKey: "Projects.portfolio.desc", link: { href: "https://github.com/durandarthur/portfolio", label: "github" } },
	gapyear: { tag: "side", nameKey: "Data.timeline.personalProject", since: 2021, period: "2021–22", textKey: "Data.timeline.personalProjectDetail" },
	oclock: { tag: "school", name: "O'clock", since: 2022, period: "2022–24", textKey: "Data.timeline.oclockDetail" },
	cesi: { tag: "school", name: "CESI", since: 2019, period: "2019–21", textKey: "Data.timeline.cesiDetail" },
};

// Category key -> techs. `used` lists CONTEXTS keys; empty means unknown yet.
export const CATEGORIES = [
	{ key: "languages", techs: [
		{ name: "C#", used: ["creapli"] },
		{ name: "C++", used: ["stlounge", "cesi"] },
		{ name: "C", used: ["cesi"] },
		{ name: "JavaScript", used: ["kalisio", "fuvi", "creapli", "portfolio", "gapyear", "oclock"] },
		{ name: "TypeScript", used: [] },
		{ name: "PHP", used: ["fuvi", "oclock", "cesi"] },
		{ name: "Python", used: ["fuvi"] },
		{ name: "SQL", used: ["cesi"] },
	] },
	{ key: "frontend", techs: [
		{ name: "Vue", used: ["kalisio", "fuvi", "portfolio", "oclock"] },
		{ name: "React", used: ["ffrework", "gapyear", "oclock"] },
		{ name: "Next.js", used: ["gapyear"] },
		{ name: "Quasar", used: [] },
		{ name: "Flutter", used: ["oclock"] },
		{ name: "Tailwind", used: ["portfolio"] },
		{ name: "Mantine UI", used: ["ffrework"] },
		{ name: "Material UI", used: [] },
		{ name: "Bootstrap", used: [] },
		{ name: "SASS · PostCSS", used: [] },
		{ name: "GSAP", used: ["portfolio"] },
	] },
	{ key: "backend", techs: [
		{ name: "Node.js", used: ["kalisio", "oclock"] },
		{ name: "Feathers.js", used: ["kalisio"] },
		{ name: "Laravel", used: ["fuvi"] },
		{ name: "Adonis.js", used: ["ffrework"] },
		{ name: "Express.js", used: [] },
		{ name: "Prisma · Knex.js", used: [] },
		{ name: "GraphQL", used: [] },
		{ name: "WebSockets", used: ["ffrework"] },
	] },
	{ key: "databases", techs: [
		{ name: "PostgreSQL", used: ["gapyear"] },
		{ name: "MySQL · MariaDB", used: [] },
		{ name: "SQL Server", used: [] },
		{ name: "MongoDB", used: [] },
	] },
	{ key: "ai", techs: [
		{ name: "Llama.cpp", used: [] },
		{ name: "Claude Code", used: [] },
	] },
	{ key: "graphics", techs: [
		{ name: "OpenGL ES 3.0 · EGL", used: ["stlounge"] },
		{ name: "GLSL", used: ["stlounge"] },
		{ name: "SDL · Dear ImGui", used: ["stlounge"] },
		{ name: "three.js", used: ["portfolio"] },
	] },
	{ key: "devops", techs: [
		{ name: "Docker", used: ["ffrework", "oclock"] },
		{ name: "nginx", used: ["ffrework"] },
		{ name: "GitHub Actions", used: ["stlounge"] },
		{ name: "AWS (S3 · SQS · SNS)", used: ["fuvi"] },
		{ name: "Cloudflare", used: ["ffrework"] },
		{ name: "Vercel · Netlify", used: [] },
	] },
	{ key: "testing", techs: [
		{ name: "Puppeteer", used: ["kalisio"] },
		{ name: "Jest", used: [] },
		{ name: "Mocha", used: [] },
		{ name: "Cypress", used: [] },
	] },
	{ key: "tooling", techs: [
		{ name: "Git", used: [] },
		{ name: "Vite", used: ["portfolio"] },
		{ name: "ESLint · Prettier", used: [] },
		{ name: "VS Code", used: [] },
		{ name: "Postman", used: [] },
		{ name: "SVN", used: [] },
	] },
	{ key: "workflow", techs: [
		{ name: "Agile", used: ["oclock"] },
		{ name: "Figma", used: [] },
		{ name: "Adobe XD · Photoshop · Illustrator", used: [] },
		{ name: "GitHub Projects · Trello", used: [] },
		{ name: "GanttProject", used: [] },
	] },
	{ key: "systems", techs: [
		{ name: "Linux", used: ["stlounge"] },
		{ name: "Windows · WSL2", used: [] },
		{ name: "macOS", used: [] },
		{ name: "VirtualBox", used: [] },
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

// Highest-priority tag among the places it was used, or null if unknown
export function tagOf(tech) {
	const tags = tech.used.map((key) => CONTEXTS[key].tag);
	return TAGS.find((tag) => tags.includes(tag)) ?? null;
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
