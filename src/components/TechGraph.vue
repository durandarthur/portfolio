<script setup>
// Graph view of the Techs window: particles regroup into a network of the
// stack. Overview = categories as linked hubs; picking one brings it to the
// centre with its techs around it. Labels are real buttons over the canvas.
import * as THREE from "three";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { $t } from "../i18n";
import { categoryLayout, overviewLayout } from "../lib/techGraph";
import { CATEGORIES, techByName } from "../techs";

const props = defineProps({
	selected: { type: String, required: true }, // tech name
});
const emit = defineEmits(["select"]);

const PARTICLES = 480;
const TWEEN_MS = 700;
const DUST_RADIUS = 0.9; // unused particles float faintly in the pane
// Token colours
const COLORS = {
	bright: new THREE.Color("#22D3EE"),
	dim: new THREE.Color("#0E7490"),
	highlight: new THREE.Color("#A5F3FC"),
};

const root = ref(null);
const renderer = ref(null);
const camera = ref(null);
const particles = ref(null);
const size = ref({ width: 0, height: 0 });
const focused = ref(null); // category key, or null for the overview
const labels = ref([]);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
const easeOut = (p) => 1 - (1 - p) * (1 - p);

// Per-particle state, out of Vue's reactivity
let states = [];
let spin = 0;
const dummy = new THREE.Object3D();
const color = new THREE.Color();

function dustPoint() {
	return {
		x: Math.random() * size.value.width,
		y: Math.random() * size.value.height,
		r: DUST_RADIUS,
		color: "dim",
	};
}

function initParticles() {
	states = Array.from({ length: PARTICLES }, () => {
		const p = dustPoint();
		return { ...p, col: COLORS.dim.clone(), from: null, to: null, fromCol: null, t0: 0, dur: 0 };
	});
}

function layout() {
	const { width, height } = size.value;
	if (!width || !height) return;
	const next = focused.value
		? categoryLayout(focused.value, props.selected, width, height)
		: overviewLayout(width, height);
	labels.value = next.labels;
	const now = performance.now();
	const dur = reducedMotion.matches ? 0 : TWEEN_MS;
	states.forEach((s, i) => {
		s.from = { x: s.x, y: s.y, r: s.r };
		s.fromCol = s.col.clone();
		s.to = next.particles[i] ?? dustPoint();
		s.t0 = now;
		s.dur = dur;
	});
}

function frame() {
	const mesh = particles.value?.mesh;
	if (!mesh || document.hidden) return;
	const now = performance.now();
	if (!reducedMotion.matches) spin += 0.01;

	states.forEach((s, i) => {
		if (s.to) {
			const p = s.dur > 0 ? Math.min(1, (now - s.t0) / s.dur) : 1;
			const e = easeOut(p);
			s.x = s.from.x + (s.to.x - s.from.x) * e;
			s.y = s.from.y + (s.to.y - s.from.y) * e;
			s.r = s.from.r + (s.to.r - s.from.r) * e;
			s.col.copy(s.fromCol).lerp(COLORS[s.to.color], e);
		}
		dummy.position.set(s.x, -s.y, 0);
		dummy.rotation.set(spin, spin, spin);
		dummy.scale.setScalar(s.r);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);
		mesh.setColorAt(i, color.copy(s.col));
	});
	mesh.instanceMatrix.needsUpdate = true;
	mesh.instanceColor.needsUpdate = true;
}

// The canvas follows the pane size; 1 unit = 1 px, y down
function resize(width, height) {
	const first = !size.value.width;
	size.value = { width, height };
	// Start scattered over the pane, then gather into the graph
	if (first) states.forEach((s) => Object.assign(s, dustPoint()));
	renderer.value.three.setSize(width, height);
	const cam = camera.value.camera;
	Object.assign(cam, { left: 0, right: width, top: 0, bottom: -height });
	cam.updateProjectionMatrix();
	layout();
}

// ── Navigation ───────────────────────────────────────────────────
function openCategory(key) {
	focused.value = key;
	// Keep the details panel on a tech of this category
	if (techByName(props.selected)?.category !== key) {
		const cat = CATEGORIES.find((c) => c.key === key);
		emit("select", (cat.techs.find((t) => t.used.length) ?? cat.techs[0]).name);
	}
}

watch(focused, layout);
watch(
	() => props.selected,
	(name) => {
		// Picked elsewhere (tree, "paired with"): follow it to its category
		const cat = techByName(name)?.category;
		if (focused.value && cat && cat !== focused.value) focused.value = cat;
		else layout();
	}
);

let observer;
onMounted(() => {
	initParticles();
	const mesh = particles.value.mesh;
	// Per-instance colours: set once so the shader compiles with them
	states.forEach((s, i) => mesh.setColorAt(i, s.col));
	mesh.material.needsUpdate = true;
	renderer.value.onBeforeRender(frame);
	observer = new ResizeObserver(([entry]) => {
		const { width, height } = entry.contentRect;
		if (width && height) resize(Math.round(width), Math.round(height));
	});
	observer.observe(root.value);
});
onUnmounted(() => observer?.disconnect());

// Label position: anchored on the side facing away from the centre
function labelStyle(label) {
	const transform = {
		left: "translate(0, -50%)",
		right: "translate(-100%, -50%)",
		above: "translate(-50%, -100%)",
		below: "translate(-50%, 0)",
	}[label.align];
	return { left: `${label.x}px`, top: `${label.y}px`, transform };
}
</script>

<template>
	<div ref="root" class="graph" role="group" :aria-label="$t('Techs.graphLabel')">
		<Renderer ref="renderer" alpha :pixel-ratio="pixelRatio" aria-hidden="true">
			<OrthographicCamera ref="camera" :position="{ z: 100 }" />
			<Scene>
				<InstancedMesh ref="particles" :count="PARTICLES">
					<TetrahedronGeometry />
					<BasicMaterial :props="{ wireframe: true }" color="#ffffff" />
				</InstancedMesh>
			</Scene>
		</Renderer>

		<nav class="graph__crumbs" :aria-label="$t('Techs.graphLabel')">
			<button
				v-if="focused"
				type="button"
				class="graph__crumb"
				@click="focused = null"
			>
				{{ $t("App.apps.techs.label") }}
			</button>
			<span v-else class="graph__crumb is-current" aria-current="location">
				{{ $t("App.apps.techs.label") }}
			</span>
			<span v-if="focused" class="graph__crumb is-current" aria-current="location">
				{{ $t(`Techs.folders.${focused}`) }}
			</span>
		</nav>

		<div class="graph__labels">
			<template v-for="label in labels" :key="label.kind + (label.key ?? label.name)">
				<button
					v-if="label.kind === 'hub'"
					type="button"
					class="graph__label graph__label--hub"
					:class="{ 'is-dim': !label.active }"
					:style="labelStyle(label)"
					@click="openCategory(label.key)"
				>
					{{ $t(`Techs.folders.${label.key}`) }}
					<span class="graph__count">{{ label.count }}</span>
				</button>
				<button
					v-else
					type="button"
					class="graph__label graph__label--tech"
					:class="{ 'is-selected': label.selected, 'is-dim': !label.known }"
					:style="labelStyle(label)"
					:title="label.name"
					:aria-pressed="label.selected"
					@click="emit('select', label.name)"
				>
					{{ label.name }}
				</button>
			</template>
		</div>

		<span v-if="focused" class="graph__center" aria-hidden="true">
			{{ $t(`Techs.folders.${focused}`) }}
		</span>
		<p class="graph__hint">
			{{ focused ? $t("Techs.graphPickTech") : $t("Techs.graphPickCategory") }}
		</p>
	</div>
</template>

<style scoped>
.graph {
	position: relative;
	overflow: hidden;
	font-size: 12px;
}
.graph :deep(canvas) {
	position: absolute;
	inset: 0;
	display: block;
	width: 100%;
	height: 100%;
}

.graph__crumbs {
	position: absolute;
	left: 14px;
	top: 8px;
	z-index: 1;
	display: flex;
	align-items: center;
}
.graph__crumb {
	height: 40px;
	padding: 0 4px;
	border: 0;
	background: transparent;
	color: var(--text-muted);
	font-size: 12px;
	display: flex;
	align-items: center;
}
button.graph__crumb {
	cursor: pointer;
}
button.graph__crumb:hover {
	color: var(--text-strong);
}
.graph__crumb.is-current {
	color: var(--cyan);
	font-weight: 700;
}

.graph__labels {
	position: absolute;
	inset: 0;
}
.graph__label {
	position: absolute;
	min-height: 32px;
	padding: 0 6px;
	border: 0;
	background: transparent;
	font-size: 12px;
	white-space: nowrap;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
}
.graph__label--hub {
	color: var(--text-strong);
	font-weight: 700;
}
.graph__label--hub:hover {
	color: var(--cyan);
}
.graph__count {
	font-size: 11px;
	font-weight: 400;
	color: var(--text-muted);
}
.graph__label--tech {
	display: block;
	line-height: 32px;
	max-width: 124px;
	overflow: hidden;
	text-overflow: ellipsis;
	color: var(--text);
}
.graph__label--tech:hover {
	color: var(--text-strong);
}
.graph__label.is-dim {
	color: var(--text-muted);
}
.graph__label--tech.is-selected {
	color: var(--cyan);
	font-weight: 700;
	text-shadow: 0 0 12px rgba(34, 211, 238, 0.6);
}

.graph__center {
	position: absolute;
	left: 50%;
	top: calc(50% + 26px);
	transform: translateX(-50%);
	color: var(--cyan);
	font-weight: 700;
	pointer-events: none;
}
.graph__hint {
	position: absolute;
	left: 18px;
	bottom: 12px;
	margin: 0;
	font-size: 11px;
	color: var(--text-muted);
	pointer-events: none;
}
</style>
