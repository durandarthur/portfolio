// Projects shown in the Projects window. Text lives in i18n.js under "Projects".

export const PROJECT_FILTERS = ["all", "web", "desktop", "ai", "work"];

export const projects = [
	{
		key: "stlounge",
		name: "stlounge",
		featured: true,
		tags: ["desktop"],
		image: "/stlounge-thumbnail.webp",
		stack: ["C++", "OpenGL ES 3.0", "SDL", "Dear ImGui", "Linux · AppImage"],
		link: { href: "https://github.com/durandarthur/stlounge", label: "github" },
	},
	{
		key: "ffrework",
		// Translated name
		nameKey: "App.ffReworkTitle",
		meta: "2025",
		tags: ["web"],
		image: "/fanfictionrework-thumbnail.webp",
		stack: ["Adonis.js", "React", "Mantine UI", "Docker", "nginx"],
		link: { href: "https://demo.fanfiction-rework.com/", label: "demo" },
	},
	{
		key: "portfolio",
		name: "portfolio",
		metaKey: "Projects.portfolio.meta",
		tags: ["web"],
		image: "/portfolio-thumbnail.webp",
		stack: ["Vue 3", "Vite", "three.js", "Tailwind", "WebGL"],
		link: {
			href: "https://github.com/durandarthur/portfolio",
			label: "github",
		},
	},
	{
		key: "jpreplace",
		name: "jpreplace",
		meta: "2026",
		tags: ["ai"],
		image: "/jpreplace-thumbnail.png",
		stack: ["Python", "PySide6", "PP-OCRv6", "PlaMo 3 Translate"],
		link: {
			href: "https://github.com/durandarthur/jpreplace",
			label: "github",
		},
	},
	{
		key: "ytsummarize",
		name: "ytsummarize",
		meta: "2026",
		tags: ["ai"],
		stack: ["Python", "Local LLM API"],
		link: {
			href: "https://github.com/durandarthur/ytsummarize",
			label: "github",
		},
	},
];
