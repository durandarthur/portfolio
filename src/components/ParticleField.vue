<script setup>
// Background particle field (three.js through TroisJS).
// Particles drift across the screen. At rest some of them spell the name;
// they gather into an app's glyph when its icon is hovered or its window is
// focused.
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { particleSettings as settings } from "../lib/particleSettings";

const props = defineProps({
	// A window has focus: blur the field (see .particle-layer.is-defocused)
	defocused: { type: Boolean, default: false },
});

// Glyph per app: the lines of its desktop icon (public/glyphs, editable
// SVG strokes without the icons' shading seams).
const GLYPHS = {
	contact: () => lineFormation("/glyphs/contact.svg"),
	cv: () => lineFormation("/glyphs/cv.svg"),
	projects: () => lineFormation("/glyphs/projects.svg"),
	terminal: () => lineFormation("/glyphs/terminal.svg"),
	techs: () => lineFormation("/glyphs/techs.svg"),
};

// The name at rest, drawn in the site font: particles along the letter edges
const NAME = "ARTHUR DURAND";
const NAME_FONT = '800 {size}px "JetBrains Mono", ui-monospace, monospace';
const NAME_MAX_SIZE = 110; // px, shrunk to fit the space the page reserves
const NAME_RADIUS = 2.4; // px at 100px text
const NAME_BUDGET = 480; // particles along the edges
const NAME_MIN_SPACING = 5; // px, so small screens don't pile particles up
const GLYPH_BUDGET = 240; // particles along an icon glyph's lines
// Name particles turn into solid, brighter tetrahedra as they land
const NAME_COLOR = "#22D3EE";
const SOLID_AT = 0.6; // share of the flight after which they turn solid
// The name assembles from left to right, as if typed after "whoami".
// On page load it takes TYPE_MS + FORM_MS; every later time (after a hover
// or a window) it runs NAME_SPEED times faster, both sweep and flight.
const TYPE_MS = 1200;
const NAME_SPEED = 1.5;
// Once formed, a few name particles briefly swell and brighten at random:
// each one every 2π / TWINKLE_SPEED s, for a short spike (sharper = rarer)
const TWINKLE_COLOR = "#A5F3FC";
const TWINKLE_SPEED = 0.6; // rad/s
const TWINKLE_SHARPNESS = 40;
const TWINKLE_SCALE = 0.8; // extra size at the peak
// Extra particles for the formations (name, glyphs), on top of the star
// field's own amount, so the field keeps its density while they form
const FORMATION_POOL = Math.max(NAME_BUDGET, GLYPH_BUDGET);

// Timed ease-out tweens (like gsap's power1.out): fast start, gentle stop
const FORM_MS = 800; // into a glyph
const SCATTER_MS = 700; // out of a glyph, then the particle drifts again
const SETTLE_MS = 1400; // glyph particles scattering back after a hover ends
const RETURN_MS = 500; // back into the glyph after a mouse push
const easeOut = (p) => 1 - (1 - p) * (1 - p);

// Depth: field particles sit between z = 0 and z = -depth, biased towards far.
// depth = camera distance × DEPTH_FACTOR, so the farthest ones show at
// 1 / (1 + 4.9) ≈ 17% of their size.
const DEPTH_FACTOR = 4.9;
const DEPTH_BIAS = 0.55; // z = rand^0.55 × depth: most particles are far
const FIELD_RADIUS = 6; // px at z = 0
const FORM_RADIUS = 2.5; // px, particles in a glyph
const PARTICLE_COLOR = "#04D9FF";
// Fog: far particles fade towards this colour, up to 85% at full depth
const FOG_COLOR = 0x061020;
const FOG_MAX = 0.85;

const renderer = ref(null);
const camera = ref(null);
const box = ref(null);
const light = ref(null);
const particles = ref(null);
const nameParticles = ref(null); // solid mesh for the name
const scene = ref(null);
const meshKey = ref(0);

// Capped at 2. Dropped to 1 while defocused: the blur hides it.
const FULL_PIXEL_RATIO = Math.min(window.devicePixelRatio || 1, 2);
const DEFOCUS_MS = 400; // matches the CSS transition
const pixelRatio = ref(FULL_PIXEL_RATIO);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Per-particle state, kept out of Vue's reactivity (updated every frame)
// { x, y, z, r, target, local, from, t0, dur, release }
// target: {x, y, z, r} or null when drifting. local: the target is in the
// current formation's space (relative to its centre).
// release: drift again on arrival.
let states = [];
let spin = 0;
const dummy = new THREE.Object3D();
const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);
const nameColor = new THREE.Color(NAME_COLOR);
const twinkleColor = new THREE.Color(TWINKLE_COLOR);
const color = new THREE.Color();

// ── Camera ───────────────────────────────────────────────────────
// The camera sits where 1 world unit = 1 CSS px at z = 0.
function cameraDistance(fov, height) {
	return height / (2 * Math.tan((fov * Math.PI) / 360));
}
let camDist = cameraDistance(50, window.innerHeight);
const depth = () => camDist * DEPTH_FACTOR;
// On-screen scale of something at depth z (z <= 0)
const perspective = (z) => camDist / (camDist - z);

const halfWidth = () => document.body.clientWidth / 2;
const halfHeight = () => document.body.clientHeight / 2;

// Random spot in the field, filling the screen at its depth
function randomFieldPoint() {
	const z = -Math.pow(Math.random(), DEPTH_BIAS) * depth();
	const spread = 1 / perspective(z);
	return {
		x: (Math.random() * 2 - 1) * halfWidth() * spread,
		y: (Math.random() * 2 - 1) * halfHeight() * spread,
		z,
		r: FIELD_RADIUS,
	};
}

function initParticles() {
	states = Array.from({ length: particleCount() }, () => ({
		...randomFieldPoint(),
		target: null,
		local: false,
		from: null,
		t0: 0,
		dur: 0,
		release: false,
	}));
}

// Start a tween from where the particle is now (after `delay` ms)
function tweenTo(s, target, ms, { local = false, release = false, delay = 0 } = {}) {
	const still = reducedMotion.matches;
	s.from = { x: s.x, y: s.y, z: s.z, r: s.r };
	s.t0 = performance.now() + (still ? 0 : delay);
	s.dur = still ? 0 : ms;
	s.target = target;
	s.local = local;
	s.release = release;
}

// Star field particles + the formation pool
const particleCount = () => Number(settings.amount) + FORMATION_POOL;

function onResize() {
	const { innerWidth, innerHeight } = window;
	settings.amount = Math.ceil(((innerWidth * innerHeight) / (2560 * 1440)) * 1000);
	camDist = cameraDistance(50, innerHeight);
	const cam = camera.value.camera;
	cam.aspect = innerWidth / innerHeight;
	cam.position.z = camDist;
	cam.far = camDist + depth() + 100;
	cam.updateProjectionMatrix();
	// Fog grows with distance from the camera: none at z = 0, FOG_MAX at full depth
	scene.value.scene.fog = new THREE.Fog(FOG_COLOR, camDist, camDist + depth() / FOG_MAX);
	refreshFormation();
}

// ── Mouse: push nearby particles away ────────────────────────────
function onMouseMove(event) {
	box.value.mesh.rotation.x = 2 * (event.clientY / document.body.clientHeight) - 1;
	box.value.mesh.rotation.y = 2 * (event.clientX / document.body.clientWidth) - 1;

	light.value.light.position.x = event.clientX;
	light.value.light.position.y = event.clientY;
	light.value.light.position.z = 3;

	if (reducedMotion.matches) return;

	const mouseX = event.clientX - halfWidth();
	const mouseY = -(event.clientY - halfHeight());
	const rangeSquared = Number(settings.mouseRange) ** 2;
	const amplitude = Number(settings.mouseAmplitude) / 100;

	// Compared on screen, so far particles react where they appear
	for (const s of states) {
		const k = perspective(s.z);
		const dx = mouseX - s.x * k;
		const dy = mouseY - s.y * k;
		const distanceSquared = dx * dx + dy * dy;
		if (distanceSquared < rangeSquared) {
			const strength = amplitude * (1 - distanceSquared / rangeSquared);
			s.x -= (dx * strength) / k;
			s.y -= (dy * strength) / k;
			// Pushed out of a glyph: ease back in
			if (s.target && !s.release) tweenTo(s, s.target, RETURN_MS, { local: s.local });
		}
	}
}

// ── Glyph formations ─────────────────────────────────────────────
const svgCache = new Map();
async function loadSvg(url) {
	if (!svgCache.has(url)) svgCache.set(url, new SVGLoader().loadAsync(url));
	return svgCache.get(url);
}

// A particle on every vertex (corners, and every point where lines meet),
// then the rest spread at one even spacing along the lines of a stroke SVG
// (lines drawn twice count once, open lines stay open). Uses the formation
// glyph budget, centred on the screen and scaled to half its smaller side.
async function lineFormation(url) {
	const { paths } = await loadSvg(url);

	const segments = [];
	const seen = new Set();
	const key = (p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
	for (const path of paths) {
		for (const sub of path.subPaths) {
			const pts = sub.getPoints(); // includes the closing point after Z
			for (let i = 1; i < pts.length; i++) {
				const [a, b] = [pts[i - 1], pts[i]];
				const id = [key(a), key(b)].sort().join("|");
				if (a.equals(b) || seen.has(id)) continue;
				seen.add(id);
				segments.push([a, b]);
			}
		}
	}

	const points = [];
	const vertices = new Set();
	const bounds = new THREE.Box2();
	for (const [a, b] of segments) {
		bounds.expandByPoint(a).expandByPoint(b);
		for (const v of [a, b]) {
			if (vertices.has(key(v))) continue;
			vertices.add(key(v));
			points.push({ x: v.x, y: v.y });
		}
	}

	// A segment cut into n pieces gets n - 1 points between its ends
	const total = segments.reduce((sum, [a, b]) => sum + a.distanceTo(b), 0);
	const spacing = total / Math.max(1, GLYPH_BUDGET - points.length + segments.length);
	for (const [a, b] of segments) {
		const n = Math.max(1, Math.round(a.distanceTo(b) / spacing));
		for (let i = 1; i < n; i++) {
			const t = i / n;
			points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
		}
	}

	const size = Math.ceil(Math.min(window.innerHeight, window.innerWidth) / 2);
	const scale = size / Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y);
	const cx = (bounds.min.x + bounds.max.x) / 2;
	const cy = (bounds.min.y + bounds.max.y) / 2;
	return {
		center: { x: 0, y: 0 },
		// SVG y points down, world y up
		points: points.map((p) => ({ x: (p.x - cx) * scale, y: (cy - p.y) * scale, z: 0, r: FORM_RADIUS })),
	};
}

// Is JetBrains Mono 800 loaded? (document.fonts.check() can't tell: it
// answers true while the font isn't even declared yet)
const nameFontLoaded = () =>
	[...document.fonts].some(
		(face) =>
			face.family.replace(/["']/g, "") === "JetBrains Mono" &&
			face.weight === "800" &&
			face.status === "loaded"
	);

// If the name had to be drawn in a fallback font (the font's stylesheet or
// file wasn't there yet), draw it again once JetBrains Mono 800 has loaded
let waitingForNameFont = false;
function redrawNameWhenFontLoads() {
	if (waitingForNameFont) return;
	waitingForNameFont = true;
	const retry = async () => {
		try {
			await document.fonts.load(NAME_FONT.replace("{size}", 100));
		} catch {}
		if (!nameFontLoaded()) return;
		document.fonts.removeEventListener("loadingdone", retry);
		waitingForNameFont = false;
		if (formationKey === "name") refreshFormation();
	};
	document.fonts.addEventListener("loadingdone", retry);
}

// Points along the edges of the name rendered on a hidden canvas,
// kept at least `spacing` apart (greedy, on a grid)
// Keyed by size and font, so fallback-font points are never reused
const nameCache = new Map();
function nameEdgePoints(size) {
	const cacheKey = `${size}:${nameFontLoaded()}`;
	if (nameCache.has(cacheKey)) return nameCache.get(cacheKey);
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	const font = NAME_FONT.replace("{size}", size);
	ctx.font = font;
	const width = Math.ceil(ctx.measureText(NAME).width) + 8;
	const height = Math.ceil(size * 1.2) + 8;
	canvas.width = width;
	canvas.height = height;
	ctx.font = font; // resizing the canvas resets it
	ctx.textBaseline = "middle";
	ctx.fillStyle = "#fff";
	ctx.fillText(NAME, 4, height / 2);

	// Edge pixels: inside the letters, next to a pixel outside
	const alpha = ctx.getImageData(0, 0, width, height).data;
	const inside = (x, y) =>
		x >= 0 && y >= 0 && x < width && y < height && alpha[(y * width + x) * 4 + 3] >= 128;
	const edges = [];
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (inside(x, y) && (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)))
				edges.push([x, y]);
		}
	}

	// Each edge pixel is about 1px of outline
	const spacing = Math.max(NAME_MIN_SPACING, edges.length / NAME_BUDGET);
	const grid = new Map();
	const cellOf = (x, y) => `${Math.floor(x / spacing)},${Math.floor(y / spacing)}`;
	const points = [];
	for (const [x, y] of edges) {
		const cx = Math.floor(x / spacing);
		const cy = Math.floor(y / spacing);
		let near = false;
		for (let dx = -1; dx <= 1 && !near; dx++)
			for (let dy = -1; dy <= 1 && !near; dy++)
				near = (grid.get(`${cx + dx},${cy + dy}`) ?? []).some(
					([px, py]) => (px - x) ** 2 + (py - y) ** 2 < spacing * spacing
				);
		if (near) continue;
		const key = cellOf(x, y);
		grid.set(key, [...(grid.get(key) ?? []), [x, y]]);
		points.push({ x: x - width / 2, y: height / 2 - y });
	}
	nameCache.set(cacheKey, points);
	return points;
}

// The name, centred on the element the page marks with
// data-particle-anchor="name" (the gap in the idle text)
async function nameFormation() {
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const anchor = document.querySelector('[data-particle-anchor="name"]');
	const box = anchor?.getBoundingClientRect();
	const rect =
		box && box.width > 0
			? box
			: { left: vw / 2 - 540, top: (vh - 104) / 2 - 65, width: 1080, height: 130 };

	// The font may still be loading on the first visit
	try {
		await document.fonts.load(NAME_FONT.replace("{size}", 100));
	} catch {}
	if (!nameFontLoaded()) redrawNameWhenFontLoads();
	const measure = document.createElement("canvas").getContext("2d");
	measure.font = NAME_FONT.replace("{size}", 100);
	const widthAt100 = measure.measureText(NAME).width;
	const size = Math.floor(Math.min(NAME_MAX_SIZE, (100 * rect.width) / widthAt100));
	const radius = (NAME_RADIUS * size) / 100;

	return {
		center: {
			x: rect.left + rect.width / 2 - vw / 2,
			y: -(rect.top + rect.height / 2 - vh / 2),
		},
		points: nameEdgePoints(size).map((p) => ({
			x: p.x,
			y: p.y,
			z: (Math.random() - 0.5) * 8,
			r: radius,
		})),
	};
}

// At most `budget` points, thinned out evenly if needed
function fitToBudget(points, budget) {
	if (points.length <= budget) return points;
	return Array.from({ length: budget }, (_, i) => points[Math.floor((i * points.length) / budget)]);
}


// Hovered icon wins over the focused window; the name shows otherwise
let hoverKey = null;
let activeKey = null;
let formationKey = null;
let formation = null; // { points, center }
let request = 0;
let nameFormedBefore = false;

// Durations: snappy when a formation starts, slower when settling back
// after a hover ends
async function updateFormation({ formMs = FORM_MS, scatterMs = SCATTER_MS } = {}) {
	const key = hoverKey ?? activeKey ?? "name";
	if (key === formationKey) return;
	const id = ++request;
	let next = null;
	if (key === "name") {
		await nextTick(); // let the idle text (and its anchor) render first
		next = await nameFormation();
	} else if (GLYPHS[key]) {
		next = await GLYPHS[key]();
	}
	if (id !== request) return; // a newer request replaced this one
	formationKey = key;
	formation = next;

	const points = next ? fitToBudget(next.points, FORMATION_POOL) : [];
	// The name: delay each particle by its position, left to right
	const xs = points.map((p) => p.x);
	const minX = Math.min(...xs);
	const spanX = Math.max(...xs) - minX || 1;
	const naming = key === "name";
	// The name: its own timing, slower the very first time (page load)
	const speed = nameFormedBefore ? NAME_SPEED : 1;
	if (naming) nameFormedBefore = true;
	const delayOf = (p) => (naming ? (TYPE_MS * (p.x - minX)) / spanX / speed : 0);
	const flightMs = naming ? FORM_MS / speed : formMs;
	states.forEach((s, i) => {
		if (i < points.length)
			tweenTo(s, points[i], flightMs, { local: true, delay: delayOf(points[i]) });
		// Leaving the formation: ease out to a random spot, then drift
		else if (s.target && !s.release)
			tweenTo(s, randomFieldPoint(), scatterMs, { release: true });
	});
}

function refreshFormation() {
	formationKey = null;
	updateFormation();
}

// ── Frame loop ───────────────────────────────────────────────────
function frame() {
	const mesh = particles.value?.mesh;
	const solidMesh = nameParticles.value?.mesh;
	if (!mesh || !solidMesh || document.hidden) return;
	const naming = formationKey === "name";
	// Per-particle colours on the solid mesh (set once so the shader uses them)
	if (!solidMesh.instanceColor) {
		for (let i = 0; i < solidMesh.count; i++) solidMesh.setColorAt(i, nameColor);
		solidMesh.material.needsUpdate = true;
	}

	const now = performance.now();
	const still = reducedMotion.matches;
	if (!still) spin += 0.01;

	// Local targets are relative to the formation's centre
	const f = formation;
	const world = { x: 0, y: 0, z: 0, r: 0 };
	const toWorld = (p) => {
		world.x = f.center.x + p.x;
		world.y = f.center.y + p.y;
		world.z = p.z;
		world.r = p.r;
		return world;
	};

	const w = halfWidth();
	const h = halfHeight();
	const n = states.length;
	const count = Math.min(n, mesh.count);

	for (let i = 0; i < count; i++) {
		const s = states[i];
		let p = 1;
		if (s.target) {
			// 0 while waiting for its delay
			p = s.dur > 0 ? Math.min(1, Math.max(0, (now - s.t0) / s.dur)) : 1;
			const e = easeOut(p);
			const t = s.local && f ? toWorld(s.target) : s.target;
			s.x = s.from.x + (t.x - s.from.x) * e;
			s.y = s.from.y + (t.y - s.from.y) * e;
			s.z = s.from.z + (t.z - s.from.z) * e;
			s.r = s.from.r + (t.r - s.from.r) * e;
			if (p >= 1 && s.release) s.target = null;
		} else if (!still) {
			// Drift up and to the right, faster for higher indices, and wrap
			// at the screen edge for that depth
			const spread = 1 / perspective(s.z);
			if (s.x >= w * spread) s.x = -w * spread;
			else s.x += i / n;
			if (s.y >= h * spread) s.y = -h * spread;
			else s.y += i / n;
		}

		// Each particle shows in one mesh: solid once it has landed in the name
		const solid = naming && s.local && s.target && p >= SOLID_AT;
		const twinkle =
			solid && p >= 1 && !still
				? Math.max(0, Math.sin((now / 1000) * TWINKLE_SPEED + i * 2.39996)) ** TWINKLE_SHARPNESS
				: 0;

		dummy.position.set(s.x, s.y, s.z);
		dummy.rotation.set(spin, spin, spin);
		dummy.scale.setScalar(s.r * (1 + TWINKLE_SCALE * twinkle));
		dummy.updateMatrix();
		mesh.setMatrixAt(i, solid ? HIDDEN : dummy.matrix);
		solidMesh.setMatrixAt(i, solid ? dummy.matrix : HIDDEN);
		if (solid) solidMesh.setColorAt(i, color.copy(nameColor).lerp(twinkleColor, twinkle));
	}
	mesh.instanceMatrix.needsUpdate = true;
	solidMesh.instanceMatrix.needsUpdate = true;
	solidMesh.instanceColor.needsUpdate = true;
}

let defocusTimer;
watch(
	() => props.defocused,
	(defocused) => {
		clearTimeout(defocusTimer);
		// Lower the resolution once the blur has faded in, restore it at once
		if (defocused) defocusTimer = setTimeout(() => (pixelRatio.value = 1), DEFOCUS_MS);
		else pixelRatio.value = FULL_PIXEL_RATIO;
	}
);

watch(
	() => settings.amount,
	() => {
		meshKey.value++;
		initParticles();
		refreshFormation();
	}
);

onMounted(() => {
	initParticles();
	onResize();
	window.addEventListener("resize", onResize);
	document.addEventListener("mousemove", onMouseMove);
	renderer.value.onBeforeRender(frame);
});

onUnmounted(() => {
	window.removeEventListener("resize", onResize);
	document.removeEventListener("mousemove", onMouseMove);
	clearTimeout(defocusTimer);
});

defineExpose({
	// An icon is hovered (or keyboard-focused)
	hover(key) {
		hoverKey = key;
		updateFormation();
	},
	leave() {
		hoverKey = null;
		updateFormation({ scatterMs: SETTLE_MS });
	},
	// The focused window's app, or null
	setActive(key) {
		activeKey = key;
		updateFormation();
	},
});
</script>

<template>
	<div class="particle-layer" :class="{ 'is-defocused': defocused }" aria-hidden="true">
		<Renderer
			ref="renderer"
			:resize="'window'"
			pointer
			alpha
			:pixel-ratio="pixelRatio"
			class="testg"
		>
			<Camera ref="camera" :position="{ z: 1500 }" :aspect="16 / 9" />
			<Scene ref="scene">
				<PointLight ref="light" color="#00ffff" />
				<Box
					ref="box"
					:rotation="{ y: Math.PI / 4, z: Math.PI / 4 }"
					:position="{ z: 100000 }"
					widthSegments="5"
					heightSegments="5"
					depthSegments="5"
					:size="100"
				>
					<BasicMaterial :props="{ wireframe: true }" color="#04D9FF" />
				</Box>
				<InstancedMesh :key="meshKey" ref="particles" :count="particleCount()">
					<TetrahedronGeometry />
					<BasicMaterial :props="{ wireframe: true }" :color="PARTICLE_COLOR" />
				</InstancedMesh>
				<InstancedMesh :key="`name-${meshKey}`" ref="nameParticles" :count="particleCount()">
					<TetrahedronGeometry />
					<!-- White: the per-particle colours (name + twinkle) give the colour -->
					<BasicMaterial color="#ffffff" />
				</InstancedMesh>
			</Scene>
		</Renderer>
	</div>
</template>

<style scoped>
.particle-layer {
	position: fixed;
	inset: 0;
	z-index: -1;
	pointer-events: none;
	transition:
		filter 0.4s ease,
		opacity 0.4s ease;
}
.particle-layer.is-defocused {
	filter: blur(2.5px);
	opacity: 0.55;
}
@media (prefers-reduced-motion: reduce) {
	.particle-layer {
		transition: none;
	}
}
</style>
