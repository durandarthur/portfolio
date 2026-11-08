// Layouts for the Techs graph view, in pane pixels (y down).
// Each layout returns the particles to draw ({ x, y, r, color }) and the
// labels to place as buttons over them.
import { CATEGORIES, pairedWith, techByName } from "../techs";

// Hub order around the ring: strongly linked categories sit side by side
const ORDER = [
	"languages", "frontend", "backend", "devops", "graphics", "systems",
	"tooling", "testing", "databases", "workflow", "other", "ai",
];
const categories = ORDER.map((key) => CATEGORIES.find((c) => c.key === key));

const known = (tech) => tech.used.length > 0;
const contextsOf = (cat) => new Set(cat.techs.flatMap((t) => t.used));

// Categories sharing jobs / projects, with how many they share
export const CATEGORY_LINKS = (() => {
	const links = [];
	categories.forEach((a, i) =>
		categories.slice(i + 1).forEach((b) => {
			const shared = [...contextsOf(a)].filter((key) => contextsOf(b).has(key));
			if (shared.length) links.push({ a: a.key, b: b.key, weight: shared.length });
		})
	);
	return links;
})();

// ── Particle helpers ─────────────────────────────────────────────
function ring(out, cx, cy, radius, count, r, color) {
	for (let i = 0; i < count; i++) {
		const a = (i / count) * Math.PI * 2;
		out.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius, r, color });
	}
}

// Dotted line from a to b, leaving gaps of trimA / trimB at the ends
function dotted(out, a, b, { spacing, r, color, trimA = 0, trimB = 0 }) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const length = Math.hypot(dx, dy);
	const usable = length - trimA - trimB;
	if (usable <= 0) return;
	const n = Math.max(1, Math.round(usable / spacing));
	for (let i = 0; i <= n; i++) {
		const t = (trimA + (usable * i) / n) / length;
		out.push({ x: a.x + dx * t, y: a.y + dy * t, r, color });
	}
}

// Label beside a node, pushed outwards from the centre
function labelAt(node, center, gap) {
	const angle = Math.atan2(node.y - center.y, node.x - center.x);
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return {
		x: node.x + cos * gap,
		y: node.y + sin * gap,
		align: cos > 0.35 ? "left" : cos < -0.35 ? "right" : sin < 0 ? "above" : "below",
	};
}

// ── Overview: categories as hubs ─────────────────────────────────
const hubRadius = (cat) => 10 + cat.techs.length * 0.7;

export function overviewLayout(width, height) {
	const center = { x: width / 2, y: height / 2 };
	const R = Math.max(60, Math.min(width / 2 - 92, height / 2 - 52));
	const particles = [];
	const labels = [];
	const hubs = {};

	categories.forEach((cat, i) => {
		const angle = -Math.PI / 2 + (i / categories.length) * Math.PI * 2;
		const node = { x: center.x + Math.cos(angle) * R, y: center.y + Math.sin(angle) * R };
		const radius = hubRadius(cat);
		const active = cat.techs.some(known);
		hubs[cat.key] = { ...node, radius };

		ring(particles, node.x, node.y, radius, Math.round((Math.PI * 2 * radius) / 6), 2.2, active ? "bright" : "dim");
		// One dot per tech around the hub
		cat.techs.forEach((tech, ti) => {
			const a = (ti / cat.techs.length) * Math.PI * 2;
			particles.push({
				x: node.x + Math.cos(a) * (radius + 7),
				y: node.y + Math.sin(a) * (radius + 7),
				r: 1.4,
				color: known(tech) ? "bright" : "dim",
			});
		});
		labels.push({ kind: "hub", key: cat.key, count: cat.techs.length, active, ...labelAt(node, center, radius + 16) });
	});

	// Stronger links (3+ shared places) are denser and brighter
	for (const { a, b, weight } of CATEGORY_LINKS) {
		const strong = weight >= 3;
		dotted(particles, hubs[a], hubs[b], {
			spacing: strong ? 9 : 15,
			r: strong ? 1.6 : 1.2,
			color: strong ? "bright" : "dim",
			trimA: hubs[a].radius + 13,
			trimB: hubs[b].radius + 13,
		});
	}
	return { particles, labels };
}

// ── One category: hub in the middle, its techs around it ─────────
export function categoryLayout(catKey, selectedName, width, height) {
	const cat = CATEGORIES.find((c) => c.key === catKey);
	const center = { x: width / 2, y: height / 2 };
	const R = Math.max(60, Math.min(width / 2 - 128, height / 2 - 56));
	const particles = [];
	const labels = [];
	const nodes = {};

	ring(particles, center.x, center.y, 18, 18, 2.2, "bright");

	cat.techs.forEach((tech, i) => {
		const angle = -Math.PI / 2 + (i / cat.techs.length) * Math.PI * 2;
		const node = { x: center.x + Math.cos(angle) * R, y: center.y + Math.sin(angle) * R };
		const selected = tech.name === selectedName;
		const radius = selected ? 9 : 6;
		nodes[tech.name] = { ...node, radius };

		ring(particles, node.x, node.y, radius, selected ? 10 : 6, selected ? 2 : 1.6,
			selected ? "highlight" : known(tech) ? "bright" : "dim");
		dotted(particles, center, node, {
			spacing: 11,
			r: 1.1,
			color: selected ? "bright" : "dim",
			trimA: 26,
			trimB: radius + 6,
		});
		labels.push({ kind: "tech", name: tech.name, selected, known: known(tech), ...labelAt(node, center, radius + 12) });
	});

	// The selected tech's related techs in this category
	const selected = techByName(selectedName);
	if (selected?.category === catKey) {
		for (const other of pairedWith(selected)) {
			if (!nodes[other.name]) continue;
			dotted(particles, nodes[selectedName], nodes[other.name], {
				spacing: 8,
				r: 1.4,
				color: "bright",
				trimA: nodes[selectedName].radius + 6,
				trimB: nodes[other.name].radius + 6,
			});
		}
	}
	return { particles, labels };
}
