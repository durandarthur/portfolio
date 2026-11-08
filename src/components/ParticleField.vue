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

	return points.map(({ x, y, z }) => ({
		x: (x + cx) * scale,
		y: (y - cy) * scale,
		z,
		r: FORM_RADIUS,
	}));
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
	if (!still) spin += 0.01;

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
	onResize();
	window.addEventListener("resize", onResize);
	document.addEventListener("mousemove", onMouseMove);
	renderer.value.onBeforeRender(frame);
});

onUnmounted(() => {
	window.removeEventListener("resize", onResize);
	document.removeEventListener("mousemove", onMouseMove);
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
				<BasicMaterial :props="{ wireframe: true }" color="#04D9FF" />
			</InstancedMesh>
		</Scene>
	</Renderer>
</template>
