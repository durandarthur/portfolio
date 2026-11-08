<script setup>
import { computed, ref } from "vue";
import { $t } from "../i18n";
import { focusWindow, isVisible, toggleFromDesktop } from "../lib/windows";
import { CATEGORIES, DEFAULT_OPEN, DEFAULT_SELECTED, techByName } from "../techs";
import TechDetails from "./TechDetails.vue";
import TechGraph from "./TechGraph.vue";
import TechTree from "./TechTree.vue";
import WindowFrame from "./WindowFrame.vue";

const view = ref("tree"); // "tree" | "graph"
const VIEWS = ["tree", "graph"];
// The graph renders only while the window shows (it has its own WebGL loop)
const visible = computed(() => isVisible("techs"));
const open = ref([...DEFAULT_OPEN]);
const selected = ref(DEFAULT_SELECTED);
const selectedTech = computed(() => techByName(selected.value));

function toggleFolder(key) {
	open.value = open.value.includes(key)
		? open.value.filter((k) => k !== key)
		: [...open.value, key];
}

// Also opens the tech's folder, e.g. when picked from "paired with"
function select(name) {
	selected.value = name;
	const tech = techByName(name);
	if (tech && !open.value.includes(tech.category)) open.value = [...open.value, tech.category];
}

function openProjects() {
	if (isVisible("projects")) focusWindow("projects");
	else toggleFromDesktop("projects");
}
</script>

<template>
	<WindowFrame
		app-key="techs"
		:title="$t('App.apps.techs.title')"
		:subtitle="$t('Techs.count').replace('{n}', CATEGORIES.length)"
		icon="/icons/techs.svg"
		:width="960"
		:height="680"
	>
		<template #header>
			<div role="group" :aria-label="$t('Techs.view')" class="view-toggle">
				<button
					v-for="v in VIEWS"
					:key="v"
					type="button"
					class="view-toggle__btn"
					:class="{ 'active-bar': view === v }"
					:aria-pressed="view === v"
					@click="view = v"
				>
					{{ $t(`Techs.${v}`) }}
				</button>
			</div>
		</template>

		<!-- The wrapper is the size container; .techs reacts to it -->
		<div class="techs-root">
			<div class="techs">
				<!-- Kept mounted so filters survive a switch to the graph -->
				<TechTree
					v-show="view === 'tree'"
					class="techs__pane"
					:selected="selected"
					:open="open"
					@select="select"
					@toggle="toggleFolder"
				/>
				<template v-if="view === 'graph'">
					<TechGraph
						v-if="visible"
						class="techs__pane techs__pane--graph"
						:selected="selected"
						@select="select"
					/>
					<div v-else class="techs__pane techs__pane--graph"></div>
				</template>
				<TechDetails
					v-if="selectedTech"
					class="techs__details"
					:tech="selectedTech"
					:graph-hint="view === 'tree'"
					@select="select"
					@open-projects="openProjects"
				/>
			</div>
		</div>
	</WindowFrame>
</template>

<style scoped>
.view-toggle {
	display: flex;
	margin-right: 10px;
}
.view-toggle__btn {
	--bar-inset: 10px;
	--bar-bottom: 6px;
	position: relative;
	height: 40px;
	padding: 0 12px;
	border: 0;
	background: transparent;
	color: var(--text-muted);
	font-size: 12px;
	cursor: pointer;
}
.view-toggle__btn.active-bar {
	color: var(--cyan);
}

.techs-root {
	container: techs / inline-size;
	height: 100%;
}
.techs {
	height: 100%;
	display: flex;
}
.techs__pane {
	width: 540px;
	flex-shrink: 0;
	min-height: 0;
}
.techs__details {
	flex: 1;
	min-width: 0;
	overflow-y: auto;
	border-left: 1px solid var(--divider);
}

/* Narrow window: details go under the tree and the whole window scrolls */
@container techs (max-width: 820px) {
	.techs {
		height: auto;
		flex-direction: column;
	}
	.techs__pane {
		width: auto;
	}
	.techs__pane--graph {
		height: 460px;
	}
	.techs__pane :deep(.tree__list) {
		overflow: visible;
	}
	.techs__details {
		overflow: visible;
		border-left: 0;
		border-top: 1px solid var(--divider);
	}
}
</style>
