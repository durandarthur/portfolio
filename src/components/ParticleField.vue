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

const EASE_RATE = 6; // how fast particles reach their target (1/s)
const SCATTER_MS = 600; // time a released particle eases out before drifting again

const renderer = ref(null);
const camera = ref(null);
const box = ref(null);
const light = ref(null);
const particles = ref(null);
const meshKey = ref(0);

const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Per-particle state, kept out of Vue's reactivity (updated every frame)
// { x, y, z, target: {x, y, z} | null, releaseAt: ms | 0 }
let states = [];
let spin = 0;
let lastFrame = performance.now();
const dummy = new THREE.Object3D();

const halfWidth = () => document.body.clientWidth / 2;
const halfHeight = () => document.body.clientHeight / 2;
const randomX = () => document.body.clientWidth * Math.random() - halfWidth();
const randomY = () => document.body.clientHeight * Math.random() - halfHeight();

function initParticles() {
	states = Array.from({ length: Number(settings.amount) }, () => ({
		x: randomX(),
		y: randomY(),
		z: 0,
		target: null,
		releaseAt: 0,
	}));
}

// ── Camera ───────────────────────────────────────────────────────
// The camera sits where 1 world unit = 1 CSS px at z = 0.
function cameraDistance(fov, height) {
	return height / (2 * Math.tan((fov * Math.PI) / 360));
}

function onResize() {
	const { innerWidth, innerHeight } = window;
	settings.amount = Math.ceil(((innerWidth * innerHeight) / (2560 * 1440)) * 1000);
	camera.value.camera.aspect = innerWidth / innerHeight;
	camera.value.camera.position.z = cameraDistance(50, innerHeight);
	camera.value.camera.updateProjectionMatrix();
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

	for (const s of states) {
		const dx = mouseX - s.x;
		const dy = mouseY - s.y;
		const distanceSquared = dx * dx + dy * dy;
		if (distanceSquared < rangeSquared) {
			const strength = amplitude * (1 - distanceSquared / rangeSquared);
			s.x -= dx * strength;
			s.y -= dy * strength;
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

	return points.map(({ x, y, z }) => ({ x: (x + cx) * scale, y: (y - cy) * scale, z }));
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

	const now = performance.now();
	states.forEach((s, i) => {
		if (i < points.length) {
			s.target = points[i];
			s.releaseAt = 0;
		} else if (s.target && !s.releaseAt) {
			// Leaving the formation: ease out to a random spot, then drift
			s.target = { x: randomX(), y: randomY(), z: 0 };
			s.releaseAt = now + SCATTER_MS;
		}
	});
}

function refreshFormation() {
	formationKey = null;
	updateFormation();
}

// ── Frame loop ───────────────────────────────────────────────────
function frame() {
	const now = performance.now();
	const dt = Math.min(0.1, (now - lastFrame) / 1000);
	lastFrame = now;
	const mesh = particles.value?.mesh;
	if (!mesh || document.hidden) return;

	const still = reducedMotion.matches;
	const ease = still ? 1 : 1 - Math.exp(-dt * EASE_RATE);
	if (!still) spin += 0.01;

	const w = halfWidth();
	const h = halfHeight();
	const n = states.length;
	const count = Math.min(n, mesh.count);

	for (let i = 0; i < count; i++) {
		const s = states[i];
		if (s.target) {
			s.x += (s.target.x - s.x) * ease;
			s.y += (s.target.y - s.y) * ease;
			s.z += (s.target.z - s.z) * ease;
			if (s.releaseAt && now >= s.releaseAt) {
				s.target = null;
				s.releaseAt = 0;
			}
		} else if (!still) {
			// Drift up and to the right, faster for higher indices, and wrap
			if (s.x >= w) s.x = -w;
			else s.x += i / n;
			if (s.y >= h) s.y = -h;
			else s.y += i / n;
		}

		dummy.position.set(s.x, s.y, s.z);
		dummy.rotation.set(spin, spin, spin);
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
		<Scene>
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
