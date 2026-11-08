<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { $t, lang, setLang } from "../i18n";
import {
	WORKSPACE_COUNT,
	currentWorkspace,
	focusedKey,
	openList,
	switchWorkspace,
	toggleFromTaskbar,
	windows,
} from "../lib/windows";

const props = defineProps({
	// [{ key, icon }]
	apps: { type: Array, required: true },
});
defineEmits(["about"]);

const openApps = computed(() =>
	openList.value
		.map((key) => props.apps.find((app) => app.key === key))
		.filter(Boolean)
);

// Clock: updates on the minute, no seconds
const now = ref(new Date());
let timer;
function tick() {
	now.value = new Date();
	timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
}
onMounted(tick);
onUnmounted(() => clearTimeout(timer));

const locale = computed(() => (lang.value === "fr" ? "fr-FR" : "en-GB"));
const time = computed(() =>
	now.value.toLocaleTimeString(locale.value, {
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	})
);
const date = computed(() =>
	now.value.toLocaleDateString(locale.value, {
		weekday: "short",
		day: "numeric",
		month: "short",
	})
);

const languages = [
	{ code: "fr", label: "FR", name: "Français" },
	{ code: "en", label: "EN", name: "English" },
];
</script>

<template>
	<footer class="taskbar frame">
		<div class="frame__body taskbar__body">
			<!-- Not restyled yet (see design handoff) -->
			<button
				type="button"
				class="taskbar__start"
				:aria-label="$t('Taskbar.about')"
				@click="$emit('about')"
			>
				AD
			</button>

			<div
				role="group"
				:aria-label="$t('Taskbar.workspaces')"
				class="taskbar__workspaces"
			>
				<button
					v-for="(_, i) in WORKSPACE_COUNT"
					:key="i"
					type="button"
					class="taskbar__ws"
					:class="{ 'is-current': currentWorkspace === i }"
					:aria-label="`${$t('Taskbar.workspace')} ${i + 1}`"
					:aria-current="currentWorkspace === i ? 'true' : undefined"
					@click="switchWorkspace(i)"
				>
					<img
						:src="
							currentWorkspace === i
								? '/icons/workspace-active.svg'
								: '/icons/workspace-inactive.svg'
						"
						width="16"
						height="16"
						alt=""
					/>
				</button>
			</div>

			<span class="taskbar__divider" aria-hidden="true"></span>

			<div
				role="group"
				:aria-label="$t('Taskbar.openWindows')"
				class="taskbar__windows"
			>
				<button
					v-for="app in openApps"
					:key="app.key"
					type="button"
					class="taskbar__win"
					:class="{
						'active-bar': !windows[app.key].minimized,
						'is-minimized': windows[app.key].minimized,
					}"
					:aria-pressed="!windows[app.key].minimized"
					:aria-current="focusedKey === app.key ? 'true' : undefined"
					@click="toggleFromTaskbar(app.key)"
				>
					<img :src="app.icon" width="18" height="18" alt="" />
					<span class="taskbar__win-label">{{ $t(`App.apps.${app.key}.title`) }}</span>
				</button>
				<span v-if="!openApps.length" class="taskbar__empty">
					{{ $t("Taskbar.noWindows") }}
				</span>
			</div>

			<div
				role="group"
				:aria-label="$t('Taskbar.language')"
				class="taskbar__lang"
			>
				<template v-for="(l, i) in languages" :key="l.code">
					<span v-if="i > 0" class="taskbar__lang-sep" aria-hidden="true">/</span>
					<button
						type="button"
						class="taskbar__lang-btn"
						:class="{ 'active-bar': lang === l.code }"
						:lang="l.code"
						:aria-label="l.name"
						:aria-pressed="lang === l.code"
						@click="setLang(l.code)"
					>
						{{ l.label }}
					</button>
				</template>
			</div>

			<div class="taskbar__clock">
				<time class="taskbar__time" :datetime="now.toISOString()">{{ time }}</time>
				<span class="taskbar__date">{{ date }}</span>
			</div>
		</div>
	</footer>
</template>

<style scoped>
.taskbar {
	position: fixed;
	left: 24px;
	right: 24px;
	bottom: 20px;
	height: 64px;
	/* above the windows */
	z-index: 1000;
}
.taskbar__body {
	box-sizing: border-box;
	padding: 0 18px;
	display: flex;
	align-items: center;
	gap: 12px;
}

.taskbar__start {
	flex-shrink: 0;
	width: 44px;
	height: 44px;
	border: 0;
	border-radius: 11px;
	background: var(--cyan);
	color: var(--on-cyan);
	font-size: 15px;
	font-weight: 800;
	cursor: pointer;
}

.taskbar__workspaces {
	display: flex;
	flex-shrink: 0;
}
.taskbar__ws {
	width: 40px;
	height: 44px;
	border: 0;
	background: transparent;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
}
.taskbar__ws.is-current img {
	filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.6));
}

.taskbar__divider {
	flex-shrink: 0;
	width: 1px;
	height: 28px;
	background: rgba(34, 211, 238, 0.18);
}

.taskbar__windows {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	gap: 4px;
	/* room for the focus outline, which overflow would clip */
	padding: 6px 4px;
	overflow-x: auto;
	scrollbar-width: none;
}
.taskbar__win {
	--bar: 3px;
	--bar-inset: 8px;
	--bar-bottom: 3px;
	position: relative;
	flex-shrink: 0;
	height: 44px;
	padding: 0 8px;
	border: 0;
	background: transparent;
	color: var(--text-strong);
	font-size: 12px;
	font-weight: 400;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
}
.taskbar__win.is-minimized {
	color: var(--text-muted);
}
.taskbar__win.is-minimized img {
	opacity: 0.55;
}
.taskbar__empty {
	font-size: 12px;
	color: var(--text-muted);
	white-space: nowrap;
}

.taskbar__lang {
	flex-shrink: 0;
	display: flex;
	align-items: center;
}
.taskbar__lang-btn {
	--bar-bottom: 8px;
	height: 44px;
	min-width: 32px;
	padding: 0 8px;
	border: 0;
	background: transparent;
	color: var(--text-muted);
	font-size: 12px;
	cursor: pointer;
}
.taskbar__lang-btn.active-bar {
	color: var(--cyan);
}
.taskbar__lang-sep {
	color: var(--text-faint);
	font-size: 12px;
}

.taskbar__clock {
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	padding: 0 8px 0 4px;
}
.taskbar__time {
	font-size: 15px;
	font-weight: 700;
	color: var(--text-strong);
}
.taskbar__date {
	font-size: 11px;
	color: var(--text-muted);
}

/* Tablet portrait and below: tighter spacing, window titles hidden visually */
@media (max-width: 767px) {
	.taskbar {
		left: 12px;
		right: 12px;
		bottom: 12px;
	}
	.taskbar__body {
		padding: 0 10px;
		gap: 6px;
	}
	.taskbar__ws {
		width: 30px;
	}
	.taskbar__win-label {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	.taskbar__date {
		display: none;
	}
	.taskbar__clock {
		padding: 0 2px;
	}
}
</style>
