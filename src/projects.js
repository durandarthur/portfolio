// Projects shown in the Projects window. Text lives in i18n.js under "Projects".

export const PROJECT_FILTERS = ["all", "web", "desktop", "ai", "work"];

export const projects = [
	{
		key: "stlounge",
		name: "stlounge",
		featured: true,
		tags: ["desktop"],
		image: "/stlounge-thumbnail.png",
		stack: ["C++", "OpenGL ES 3.0", "SDL", "Dear ImGui", "Linux · AppImage"],
		link: { href: "https://github.com/durandarthur/stlounge", label: "github" },
	},
	{
		key: "ffrework",
		// Translated name
		nameKey: "App.ffReworkTitle",
		meta: "[year]",
		tags: ["web"],
		image: "/fanfictionrework-thumbnail.png",
		stack: ["Adonis.js", "React", "Mantine UI", "Docker", "nginx"],
		link: { href: "https://demo.fanfiction-rework.com/", label: "demo" },
	},
	{
		key: "portfolio",
		name: "arthur-os",
		metaKey: "Projects.portfolio.meta",
		tags: ["web"],
		image: null, // [screenshot]
		stack: ["Vue 3", "Vite", "three.js", "Tailwind", "GSAP", "WebGL"],
		link: { href: "https://github.com/durandarthur/portfolio", label: "github" },
	},
];
