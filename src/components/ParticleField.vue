<script setup>
// Background particle field (three.js through TroisJS).
// Particles drift across the screen and gather into an app's glyph when its
// icon is hovered or its window is focused.
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { particleSettings as settings } from "../lib/particleSettings";

// Glyph outlines per app
const SHAPES = {
	contact: "/mail.svg",
	cv: "/cv.svg",
	projects: "/projects.svg",
	terminal: "/terminal_dark.svg",
	techs: "/techs_dark.svg",
};

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

const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Per-particle state, kept out of Vue's reactivity (updated every frame)
// { x, y, z, r, target, from, t0, dur, release }
// target: {x, y, z, r} or null when drifting; release: drift again on arrival
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
		from: null,
		t0: 0,
		dur: 0,
		release: false,
	}));
}

// Start a tween from where the particle is now
function tweenTo(s, target, ms, release = false) {
	s.from = { x: s.x, y: s.y, z: s.z, r: s.r };
	s.t0 = performance.now();
	s.dur = reducedMotion.matches ? 0 : ms;
	s.target = target;
	s.release = release;
}

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
			if (s.target && !s.release) tweenTo(s, s.target, RETURN_MS);
		}
	}
}

// ── Glyph formations ─────────────────────────────────────────────
const svgCache = new Map();
async function loadSvg(url) {
	if (!svgCache.has(url)) svgCache.set(url, new SVGLoader().loadAsync(url));
	return svgCache.get(url);
}

// Points along the glyph's outlines (about half the particles), centred and
// scaled to half the smaller screen side
async function shapePoints(url) {
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
	return withStragglers(outline, STRAGGLERS, dMin * size, dMax * size, STRAGGLER_Z);
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
			r: FORM_RADIUS * (0.8 + Math.random() * 0.6),
		});
	}
	return [...shape, ...extra];
}

// Hovered icon wins over the focused window
let hoverKey = null;
let activeKey = null;
let formationKey = null;
let request = 0;

async function updateFormation() {
	const key = hoverKey ?? activeKey;
	if (key === formationKey) return;
	const id = ++request;
	const points = key && SHAPES[key] ? await shapePoints(SHAPES[key]) : [];
	if (id !== request) return; // a newer request replaced this one
	formationKey = key;

	states.forEach((s, i) => {
		if (i < points.length) tweenTo(s, points[i], FORM_MS);
		// Leaving the formation: ease out to a random spot, then drift
		else if (s.target && !s.release) tweenTo(s, randomFieldPoint(), SCATTER_MS, true);
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

	const w = halfWidth();
	const h = halfHeight();
	const n = states.length;
	const count = Math.min(n, mesh.count);

	for (let i = 0; i < count; i++) {
		const s = states[i];
		if (s.target) {
			const p = s.dur > 0 ? Math.min(1, (now - s.t0) / s.dur) : 1;
			const e = easeOut(p);
			const t = s.target;
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
	<Renderer
		ref="renderer"
		:resize="'window'"
		pointer
		alpha
		:pixel-ratio="pixelRatio"
		class="testg"
		aria-hidden="true"
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
</template>
