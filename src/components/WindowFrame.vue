<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { $t } from "../i18n";
import {
	closeWindow,
	focusWindow,
	isVisible,
	minimizeWindow,
	windows,
} from "../lib/windows";

const props = defineProps({
	appKey: { type: String, required: true },
	title: { type: String, required: true },
	subtitle: { type: String, default: "" },
	icon: { type: String, default: "" },
	// Default size in px, or a fraction of the viewport when <= 1
	width: { type: Number, default: 0.6 },
	height: { type: Number, default: 0.6 },
});

const MARGIN = 24;
const TASKBAR_SPACE = 104; // taskbar (64) + its bottom gap (20) + 20
const HEADER = 46;
const MIN_W = 420;
const MIN_H = 280;

const state = computed(() => windows[props.appKey]);
const visible = computed(() => isVisible(props.appKey));
// Mounted on first open, then kept (hidden) so content keeps its state
const everOpened = ref(false);
const maximized = ref(false);
const rect = reactive({ x: 0, y: 0, w: 0, h: 0 });
const el = ref(null);
const titleId = `win-title-${props.appKey}`;

// Phones: windows always fill the screen above the taskbar
const narrowQuery = window.matchMedia("(max-width: 767px)");
const narrow = ref(narrowQuery.matches);
const onNarrowChange = (e) => (narrow.value = e.matches);

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const available = () => ({
	w: window.innerWidth - 2 * MARGIN,
	h: window.innerHeight - MARGIN - TASKBAR_SPACE,
});

function clampRect() {
	const area = available();
	rect.w = clamp(rect.w, Math.min(MIN_W, area.w), area.w);
	rect.h = clamp(rect.h, Math.min(MIN_H, area.h), area.h);
	// Keep the title bar reachable
	rect.x = clamp(rect.x, 120 - rect.w, window.innerWidth - 120);
	rect.y = clamp(rect.y, 0, window.innerHeight - TASKBAR_SPACE - HEADER);
}

// Centred above the taskbar, offset when other windows are already showing
function place() {
	const area = available();
	const size = (v, total) => (v <= 1 ? v * total : v);
	rect.w = Math.round(size(props.width, window.innerWidth));
	rect.h = Math.round(size(props.height, window.innerHeight));
	rect.w = clamp(rect.w, Math.min(MIN_W, area.w), area.w);
	rect.h = clamp(rect.h, Math.min(MIN_H, area.h), area.h);
	const others = Object.keys(windows).filter(
		(key) => key !== props.appKey && isVisible(key)
	).length;
	const offset = (others % 5) * 28;
	rect.x = Math.round((window.innerWidth - rect.w) / 2) + offset;
	rect.y = Math.round(MARGIN + (area.h - rect.h) / 2) + offset;
	maximized.value = false;
	clampRect();
}

watch(
	() => state.value?.openedAt,
	async (openedAt) => {
		if (!openedAt) return;
		everOpened.value = true;
		place();
		await nextTick();
		el.value?.focus();
	},
	{ immediate: true }
);

const frameStyle = computed(() => {
	const style = { zIndex: 10 + (state.value?.z ?? 0) };
	if (maximized.value || narrow.value) return style;
	return {
		...style,
		left: `${rect.x}px`,
		top: `${rect.y}px`,
		width: `${rect.w}px`,
		height: `${rect.h}px`,
	};
});

// Drag (title bar) and resize (bottom-right handle)
let gesture = null;

function startGesture(event, type) {
	if (event.button !== 0 || maximized.value || narrow.value) return;
	if (type === "move" && event.target.closest("button, a, input")) return;
	gesture = { type, x: event.clientX, y: event.clientY, start: { ...rect } };
	event.currentTarget.setPointerCapture(event.pointerId);
	event.preventDefault();
}
function moveGesture(event) {
	if (!gesture) return;
	const dx = event.clientX - gesture.x;
	const dy = event.clientY - gesture.y;
	if (gesture.type === "move") {
		rect.x = gesture.start.x + dx;
		rect.y = gesture.start.y + dy;
	} else {
		rect.w = gesture.start.w + dx;
		rect.h = gesture.start.h + dy;
	}
	clampRect();
}
function endGesture() {
	gesture = null;
}

function toggleMaximized() {
	if (!narrow.value) maximized.value = !maximized.value;
}

function onResize() {
	clampRect();
}

onMounted(() => {
	window.addEventListener("resize", onResize);
	narrowQuery.addEventListener("change", onNarrowChange);
});
onUnmounted(() => {
	window.removeEventListener("resize", onResize);
	narrowQuery.removeEventListener("change", onNarrowChange);
});
</script>

<template>
	<section
		v-if="everOpened"
		v-show="visible"
		ref="el"
		class="win frame frame--window"
		:class="{ 'is-max': maximized || narrow }"
		:style="frameStyle"
		:aria-labelledby="titleId"
		tabindex="-1"
		@pointerdown="focusWindow(appKey)"
		@keydown.esc="closeWindow(appKey)"
	>
		<div class="win__shadow" aria-hidden="true"></div>
		<div class="frame__body win__body">
			<header
				class="win__header"
				@pointerdown="startGesture($event, 'move')"
				@pointermove="moveGesture"
				@pointerup="endGesture"
				@pointercancel="endGesture"
				@dblclick="toggleMaximized"
			>
				<img v-if="icon" :src="icon" width="16" height="16" alt="" />
				<h2 :id="titleId" class="win__title">{{ title }}</h2>
				<span v-if="subtitle" class="win__subtitle">{{ subtitle }}</span>
				<span class="win__spacer"></span>
				<slot name="header" />
				<button
					type="button"
					class="win__ctrl"
					:aria-label="$t('Window.minimize')"
					@click="minimizeWindow(appKey)"
				>
					<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<path d="M5 12h14" />
					</svg>
				</button>
				<button
					v-if="!narrow"
					type="button"
					class="win__ctrl"
					:aria-label="maximized ? $t('Window.restore') : $t('Window.maximize')"
					:aria-pressed="maximized"
					@click="toggleMaximized"
				>
					<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="4" y="4" width="16" height="16" />
					</svg>
				</button>
				<button
					type="button"
					class="win__ctrl win__ctrl--close"
					:aria-label="$t('Window.close')"
					@click="closeWindow(appKey)"
				>
					<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				</button>
			</header>
			<div class="win__content">
				<slot />
			</div>
		</div>
		<div
			v-if="!maximized && !narrow"
			class="win__resize"
			aria-hidden="true"
			@pointerdown="startGesture($event, 'resize')"
			@pointermove="moveGesture"
			@pointerup="endGesture"
			@pointercancel="endGesture"
		></div>
	</section>
</template>

<style scoped>
.win {
	position: fixed;
	/* the separate shadow box below replaces the token's drop-shadow,
	   which is costly to repaint while dragging */
	filter: none;
}
.win:focus {
	outline: none;
}
.win.is-max {
	left: 24px;
	top: 24px;
	right: 24px;
	bottom: 104px;
}

/* clip-path would clip a box-shadow, so it sits on its own box behind */
.win__shadow {
	position: absolute;
	inset: 0;
	z-index: -1;
	box-shadow: 0 30px 90px rgba(0, 0, 0, 0.7);
	pointer-events: none;
}

.win__body {
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.win__header {
	height: 46px;
	flex-shrink: 0;
	box-sizing: border-box;
	padding: 0 8px 0 24px;
	display: flex;
	align-items: center;
	gap: 10px;
	border-bottom: 1px solid rgba(34, 211, 238, 0.16);
	background: var(--window-header);
	user-select: none;
	touch-action: none;
}
.win__title {
	margin: 0;
	font-size: 13px;
	font-weight: 700;
	color: var(--text-strong);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.win__subtitle {
	font-size: 12px;
	color: var(--text-muted);
	white-space: nowrap;
}
.win__spacer {
	flex: 1;
}
.win__ctrl {
	flex-shrink: 0;
	width: 40px;
	height: 40px;
	border: 0;
	background: transparent;
	color: var(--text-muted);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
}
.win__ctrl:hover {
	color: var(--text-strong);
}
.win__ctrl--close {
	color: var(--cyan);
}
.win__ctrl--close:hover {
	color: var(--cyan-300);
}

.win__content {
	flex: 1;
	min-height: 0;
	overflow: auto;
	position: relative;
}

/* Over the bottom-right corner mark */
.win__resize {
	position: absolute;
	right: 0;
	bottom: 0;
	z-index: 2;
	width: 20px;
	height: 20px;
	cursor: nwse-resize;
	touch-action: none;
}

@media (max-width: 767px) {
	.win.is-max {
		left: 12px;
		right: 12px;
		top: 12px;
		bottom: 88px;
	}
	.win__header {
		padding-left: 18px;
	}
	.win__subtitle {
		display: none;
	}
}
</style>
