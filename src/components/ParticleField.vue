<script setup>
// Background particle field (three.js through TroisJS).
// Particles drift across the screen. At rest some of them spell the name;
// they gather into an app's glyph when its icon is hovered or its window is
// focused. Formations are tilted in 3D and sway slowly like a turntable.
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { particleSettings as settings } from "../lib/particleSettings";

const props = defineProps({
	// A window has focus: blur the field (see .particle-layer.is-defocused)
	defocused: { type: Boolean, default: false },
});

// Glyph per app: SVG outlines, or the generated Techs network
const GLYPHS = {
	contact: () => glyphFormation("/mail.svg"),
	cv: () => glyphFormation("/cv.svg"),
	projects: () => glyphFormation("/projects.svg"),
	terminal: () => glyphFormation("/terminal_dark.svg"),
	techs: () => networkFormation(), // previous glyph: glyphFormation("/techs_dark.svg")
};

// Tilt and sway (radians). The name sways less so it stays readable.
const NAME_PRESET = { ry: -0.18, rx: 0.06, sway: 0.08 };
const GLYPH_PRESET = { ry: 0.4, rx: -0.18, sway: 0.28 };
const SWAY_SPEED = (2 * Math.PI) / 14; // one back-and-forth every 14 s

// The name at rest: 5×7 dot font, one particle per lit cell
const NAME = "ARTHUR DURAND";
const NAME_CELL = 14; // px, shrunk to fit the space the page reserves
const NAME_RADIUS = 3.5; // px at full cell size
const NAME_STRAGGLERS = 46;
const FONT = {
	A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
	R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
	T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
	H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
	U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
	D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
	N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
};
// Enough particles for the name and its stragglers on small screens
const MIN_PARTICLES = 300;

// Timed ease-out tweens (like gsap's power1.out): fast start, gentle stop
const FORM_MS = 800; // into a glyph
const SCATTER_MS = 700; // out of a glyph, then the particle drifts again
const RETURN_MS = 500; // back into the glyph after a mouse push
const easeOut = (p) => 1 - (1 - p) * (1 - p);

// Depth: field particles sit between z = 0 and z = -depth, biased towards far.
// depth = camera distance × DEPTH_FACTOR, so the farthest ones show at
// 1 / (1 + 4.9) ≈ 17% of their size.
const DEPTH_FACTOR = 4.9;
const DEPTH_BIAS = 0.55; // z = rand^0.55 × depth: most particles are far
const FIELD_RADIUS = 6; // px at z = 0
const FORM_RADIUS = 2.5; // px, particles in a glyph
// Stragglers: particles hanging around a glyph at mixed depths, as if still
// flying in. Distances are fractions of the glyph size.
const STRAGGLERS = 60;
const STRAGGLER_DIST = [0.09, 0.7];
const STRAGGLER_Z = 500; // depth spread, px
// Bokeh: a few very close, out-of-focus particles near the edges.
// [x, y] as fractions of the screen, radius in px.
const BOKEH = [
	[0.86, 0.37, 24],
	[0.82, 0.84, 34],
	[0.39, 0.08, 20],
	[0.97, 0.62, 20],
	[0.61, 0.92, 16],
];
const BOKEH_OPACITY = 0.35;
const BOKEH_Z = 0.5; // × camera distance in front of z = 0
const PARTICLE_COLOR = "#04D9FF";
// Fog: far particles fade towards this colour, up to 85% at full depth
const FOG_COLOR = 0x061020;
const FOG_MAX = 0.85;

const renderer = ref(null);
const camera = ref(null);
const box = ref(null);
const light = ref(null);
const particles = ref(null);
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
// current formation's space (moves with its tilt and sway).
// release: drift again on arrival.
let states = [];
let spin = 0;
const dummy = new THREE.Object3D();

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
	states = Array.from({ length: Number(settings.amount) }, () => ({
		...randomFieldPoint(),
		target: null,
		local: false,
		from: null,
		t0: 0,
		dur: 0,
		release: false,
	}));
}

// Start a tween from where the particle is now
function tweenTo(s, target, ms, { local = false, release = false } = {}) {
	s.from = { x: s.x, y: s.y, z: s.z, r: s.r };
	s.t0 = performance.now();
	s.dur = reducedMotion.matches ? 0 : ms;
	s.target = target;
	s.local = local;
	s.release = release;
}

function onResize() {
	const { innerWidth, innerHeight } = window;
	settings.amount = Math.max(
		MIN_PARTICLES,
		Math.ceil(((innerWidth * innerHeight) / (2560 * 1440)) * 1000)
	);
	camDist = cameraDistance(50, innerHeight);
	const cam = camera.value.camera;
	cam.aspect = innerWidth / innerHeight;
	cam.position.z = camDist;
	cam.far = camDist + depth() + 100;
	cam.updateProjectionMatrix();
	// Fog grows with distance from the camera: none at z = 0, FOG_MAX at full depth
	scene.value.scene.fog = new THREE.Fog(FOG_COLOR, camDist, camDist + depth() / FOG_MAX);
	placeBokeh();
	refreshFormation();
}

// ── Bokeh ────────────────────────────────────────────────────────
// Sprites sharing one pre-blurred triangle texture: no blur pass needed.
const BOKEH_TEXTURE_SIZE = 128;
const BOKEH_SHAPE_RADIUS = 36; // triangle radius inside the texture
let bokeh = [];

function makeBokehTexture() {
	const size = BOKEH_TEXTURE_SIZE;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d");
	// Draw off-canvas and keep only the blurred shadow (ctx.filter isn't in Safari)
	const offset = size * 4;
	ctx.shadowOffsetX = offset;
	ctx.shadowBlur = 14;
	ctx.shadowColor = PARTICLE_COLOR;
	ctx.beginPath();
	for (let i = 0; i < 3; i++) {
		const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
		const x = size / 2 - offset + Math.cos(a) * BOKEH_SHAPE_RADIUS;
		const y = size / 2 + Math.sin(a) * BOKEH_SHAPE_RADIUS;
		i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
	}
	ctx.closePath();
	ctx.lineWidth = 7;
	ctx.strokeStyle = PARTICLE_COLOR;
	ctx.fillStyle = "rgba(4, 217, 255, 0.25)";
	ctx.fill();
	ctx.stroke();
	return new THREE.CanvasTexture(canvas);
}

function createBokeh() {
	const texture = makeBokehTexture();
	bokeh = BOKEH.map(([fx, fy, radius], i) => {
		const material = new THREE.SpriteMaterial({
			map: texture,
			transparent: true,
			opacity: BOKEH_OPACITY,
			depthTest: false,
			depthWrite: false,
			fog: false,
		});
		const angle = Math.random() * Math.PI * 2;
		material.rotation = angle;
		const sprite = new THREE.Sprite(material);
		sprite.renderOrder = 10;
		scene.value.scene.add(sprite);
		return {
			sprite,
			fx,
			fy,
			radius,
			angle,
			speed: (i % 2 ? 1 : -1) * (0.04 + Math.random() * 0.04), // rad/s
		};
	});
}

function placeBokeh() {
	const z = camDist * BOKEH_Z;
	const k = perspective(z);
	const { innerWidth: w, innerHeight: h } = window;
	for (const b of bokeh) {
		b.sprite.position.set((b.fx * w - w / 2) / k, -(b.fy * h - h / 2) / k, z);
		b.sprite.scale.setScalar(((b.radius * BOKEH_TEXTURE_SIZE) / BOKEH_SHAPE_RADIUS) / k);
	}
}

function disposeBokeh() {
	for (const b of bokeh) {
		b.sprite.removeFromParent();
		b.sprite.material.dispose();
	}
	bokeh[0]?.sprite.material.map.dispose();
	bokeh = [];
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

// Points along the glyph's outlines (about half the particles), centred on
// the screen and scaled to half its smaller side
async function glyphFormation(url) {
	const { paths } = await loadSvg(url);
	const amount = Number(settings.amount);
	const points = [];
	const bounds = new THREE.Box2();

	paths.forEach((path, _, allPaths) => {
		const shapes = SVGLoader.createShapes(path);
		shapes.forEach((shape, _, allShapes) => {
			const perShape = Math.floor(amount / 2 / allPaths.length / allShapes.length);
			shape.getSpacedPoints(perShape - 1).forEach((p) => {
				bounds.expandByPoint(p);
				points.push({ x: p.x, y: -p.y, z: 0 });
			});
			shape.holes.forEach((hole, _, allHoles) => {
				hole
					.getSpacedPoints(Math.floor(perShape / allHoles.length) - 1)
					.forEach((p) => points.push({ x: p.x, y: -p.y, z: 0 }));
			});
		});
	});

	const width = bounds.max.x - bounds.min.x;
	const height = bounds.max.y - bounds.min.y;
	const size = Math.ceil(Math.min(window.innerHeight, window.innerWidth) / 2);
	const scale = size / Math.max(width, height);
	const cx = -(bounds.min.x + bounds.max.x) / 2;
	const cy = -(bounds.min.y + bounds.max.y) / 2;

	const outline = points.map(({ x, y, z }) => ({
		x: (x + cx) * scale,
		y: (y - cy) * scale,
		z,
		r: FORM_RADIUS,
	}));
	const [dMin, dMax] = STRAGGLER_DIST;
	return {
		...GLYPH_PRESET,
		center: { x: 0, y: 0 },
		shapeCount: outline.length,
		points: withStragglers(outline, STRAGGLERS, dMin * size, dMax * size, STRAGGLER_Z),
	};
}

// The Techs glyph: a ring of nodes around an inner network, in a 400-unit
// design space. Point spacing grows so it uses about half the particles.
const NETWORK = {
	ring: [200, 200, 150],
	nodes: [[350, 200], [306, 306], [200, 350], [94, 306], [50, 200], [94, 94], [200, 50], [306, 94]],
	hubs: [[225, 140], [140, 185], [255, 245], [175, 275]],
	links: [
		[200, 76, 222, 120], [118, 110, 160, 175], [330, 115, 240, 130], [76, 200, 120, 188],
		[324, 200, 272, 238], [282, 286, 268, 260], [118, 290, 158, 262], [200, 324, 182, 295],
		[245, 155, 250, 225], [157, 197, 240, 238], [160, 192, 210, 150], [195, 268, 236, 250],
	],
	extent: 352, // outer node rings span 24..376
};

function networkPoints(spacing) {
	const pts = [];
	const add = (x, y) => pts.push({ x: x - 200, y: 200 - y, z: (Math.random() - 0.5) * 10 });
	const ring = (x, y, r, gap) => {
		const n = Math.max(6, Math.round((2 * Math.PI * r) / (gap * spacing)));
		for (let i = 0; i < n; i++) {
			const a = (i / n) * 2 * Math.PI;
			add(x + Math.cos(a) * r, y + Math.sin(a) * r);
		}
	};
	ring(...NETWORK.ring, 8.5);
	NETWORK.nodes.forEach(([x, y]) => {
		ring(x, y, 26, 8.5);
		ring(x, y, 13, 9.5);
	});
	NETWORK.hubs.forEach(([x, y]) => ring(x, y, 20, 8.5));
	NETWORK.links.forEach(([x1, y1, x2, y2]) => {
		const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / (9 * spacing)));
		for (let i = 1; i < n; i++) add(x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n);
	});
	return pts;
}

function networkFormation() {
	const budget = Math.floor(Number(settings.amount) / 2);
	const full = networkPoints(1).length;
	const raw = networkPoints(Math.max(1, full / budget));
	const size = Math.ceil(Math.min(window.innerHeight, window.innerWidth) / 2);
	const scale = size / NETWORK.extent;
	const shape = raw.map((p) => ({ x: p.x * scale, y: p.y * scale, z: p.z, r: FORM_RADIUS }));
	const [dMin, dMax] = STRAGGLER_DIST;
	return {
		...GLYPH_PRESET,
		center: { x: 0, y: 0 },
		shapeCount: shape.length,
		points: withStragglers(shape, STRAGGLERS, dMin * size, dMax * size, STRAGGLER_Z),
	};
}

// The name, centred on the element the page marks with
// data-particle-anchor="name" (the gap in the idle text)
function nameFormation() {
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const anchor = document.querySelector('[data-particle-anchor="name"]');
	const box = anchor?.getBoundingClientRect();
	const rect =
		box && box.width > 0
			? box
			: { left: vw / 2 - 540, top: (vh - 104) / 2 - 65, width: 1080, height: 130 };

	const cols = NAME.length * 6 - 1;
	const cell = Math.min(NAME_CELL, rect.width / cols);
	const radius = (NAME_RADIUS * cell) / NAME_CELL;
	const width = cols * cell;
	const height = 7 * cell;
	const jitter = () => (Math.random() - 0.5) * cell * 0.15;
	const shape = [];
	[...NAME].forEach((ch, ci) => {
		FONT[ch]?.forEach((row, r) =>
			[...row].forEach((v, c) => {
				if (v !== "#") return;
				shape.push({
					x: (ci * 6 + c + 0.5) * cell - width / 2 + jitter(),
					y: height / 2 - (r + 0.5) * cell + jitter(),
					z: (Math.random() - 0.5) * 12,
					r: radius,
				});
			})
		);
	});

	const k = cell / NAME_CELL;
	return {
		...NAME_PRESET,
		center: {
			x: rect.left + rect.width / 2 - vw / 2,
			y: -(rect.top + rect.height / 2 - vh / 2),
		},
		shapeCount: shape.length,
		points: withStragglers(shape, NAME_STRAGGLERS, 24 * k, 150 * k, 300),
	};
}

// At most `budget` points: the shape first (thinned out evenly if needed),
// then as many stragglers as fit
function fitToBudget({ points, shapeCount }, budget) {
	if (shapeCount <= budget) return points.slice(0, budget);
	return Array.from({ length: budget }, (_, i) => points[Math.floor((i * shapeCount) / budget)]);
}

// Appends `count` points scattered around random points of the shape.
// The shape comes first, so it keeps priority when particles run short.
function withStragglers(shape, count, dMin, dMax, zSpread) {
	const extra = [];
	for (let i = 0; i < count && shape.length; i++) {
		const base = shape[Math.floor(Math.random() * shape.length)];
		const angle = Math.random() * Math.PI * 2;
		const d = dMin + Math.random() * (dMax - dMin);
		extra.push({
			x: base.x + Math.cos(angle) * d,
			y: base.y + Math.sin(angle) * d * 0.6,
			z: base.z + (Math.random() - 0.5) * zSpread,
			r: base.r * (0.8 + Math.random() * 0.6),
		});
	}
	return [...shape, ...extra];
}

// Hovered icon wins over the focused window; the name shows otherwise
let hoverKey = null;
let activeKey = null;
let formationKey = null;
let formation = null; // { points, shapeCount, center, ry, rx, sway }
let request = 0;

async function updateFormation() {
	const key = hoverKey ?? activeKey ?? "name";
	if (key === formationKey) return;
	const id = ++request;
	let next = null;
	if (key === "name") {
		await nextTick(); // let the idle text (and its anchor) render first
		next = nameFormation();
	} else if (GLYPHS[key]) {
		next = await GLYPHS[key]();
	}
	if (id !== request) return; // a newer request replaced this one
	formationKey = key;
	formation = next;

	const points = next ? fitToBudget(next, states.length) : [];
	states.forEach((s, i) => {
		if (i < points.length) tweenTo(s, points[i], FORM_MS, { local: true });
		// Leaving the formation: ease out to a random spot, then drift
		else if (s.target && !s.release)
			tweenTo(s, randomFieldPoint(), SCATTER_MS, { release: true });
	});
}

function refreshFormation() {
	formationKey = null;
	updateFormation();
}

// ── Frame loop ───────────────────────────────────────────────────
function frame() {
	const mesh = particles.value?.mesh;
	if (!mesh || document.hidden) return;

	const now = performance.now();
	const still = reducedMotion.matches;
	if (!still) {
		spin += 0.01;
		for (const b of bokeh) b.sprite.material.rotation = b.angle + (now / 1000) * b.speed;
	}

	// Formation tilt + turntable sway, applied to every local target
	const f = formation;
	const ry = f ? f.ry + (still ? 0 : f.sway * Math.sin((now / 1000) * SWAY_SPEED)) : 0;
	const cosY = Math.cos(ry);
	const sinY = Math.sin(ry);
	const cosX = Math.cos(f?.rx ?? 0);
	const sinX = Math.sin(f?.rx ?? 0);
	const world = { x: 0, y: 0, z: 0, r: 0 };
	const toWorld = (p) => {
		const x1 = p.x * cosY + p.z * sinY;
		const z1 = -p.x * sinY + p.z * cosY;
		world.x = f.center.x + x1;
		world.y = f.center.y + p.y * cosX - z1 * sinX;
		world.z = p.y * sinX + z1 * cosX;
		world.r = p.r;
		return world;
	};

	const w = halfWidth();
	const h = halfHeight();
	const n = states.length;
	const count = Math.min(n, mesh.count);

	for (let i = 0; i < count; i++) {
		const s = states[i];
		if (s.target) {
			const p = s.dur > 0 ? Math.min(1, (now - s.t0) / s.dur) : 1;
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

		dummy.position.set(s.x, s.y, s.z);
		dummy.rotation.set(spin, spin, spin);
		dummy.scale.setScalar(s.r);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);
	}
	mesh.instanceMatrix.needsUpdate = true;
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
	createBokeh();
	onResize();
	window.addEventListener("resize", onResize);
	document.addEventListener("mousemove", onMouseMove);
	renderer.value.onBeforeRender(frame);
});

onUnmounted(() => {
	window.removeEventListener("resize", onResize);
	document.removeEventListener("mousemove", onMouseMove);
	disposeBokeh();
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
		updateFormation();
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
				<InstancedMesh :key="meshKey" ref="particles" :count="Number(settings.amount)">
					<TetrahedronGeometry />
					<BasicMaterial :props="{ wireframe: true }" :color="PARTICLE_COLOR" />
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
