<script setup>
import { computed, nextTick, ref } from "vue";
import { $t } from "../i18n";
import { CATEGORIES, TAGS, aiOnly, tagOf } from "../techs";

const props = defineProps({
	selected: { type: String, required: true }, // tech name
	open: { type: Array, required: true }, // category keys
});
const emit = defineEmits(["select", "toggle"]);

const PREVIEW_COUNT = 3;

// ── Filters ──────────────────────────────────────────────────────
const query = ref("");
const activeTags = ref([]); // legend tags picked
const showAi = ref(true); // "used by ai": include techs only used in AI-assisted projects

const filtering = computed(
	() => !!query.value.trim() || activeTags.value.length > 0 || !showAi.value
);

function matches(tech) {
	const q = query.value.trim().toLowerCase();
	if (q && !tech.name.toLowerCase().includes(q)) return false;
	if (activeTags.value.length && !activeTags.value.includes(tagOf(tech))) return false;
	if (!showAi.value && aiOnly(tech)) return false;
	return true;
}

function toggleTag(tag) {
	activeTags.value = activeTags.value.includes(tag)
		? activeTags.value.filter((t) => t !== tag)
		: [...activeTags.value, tag];
}

// Esc clears the search first; with an empty search it closes the window
function onSearchEscape(event) {
	if (!query.value) return;
	query.value = "";
	event.stopPropagation();
}

// While filtering: only categories with matches, all open
const shownCategories = computed(() =>
	CATEGORIES.map((cat) => ({ cat, techs: cat.techs.filter(matches) })).filter(
		({ techs }) => !filtering.value || techs.length > 0
	)
);

// Flat list of visible rows, drawn with real tree characters
const rows = computed(() => {
	const list = [];
	const shown = shownCategories.value;
	shown.forEach(({ cat, techs }, ci) => {
		const lastCat = ci === shown.length - 1;
		const isOpen = filtering.value || props.open.includes(cat.key);
		const names = cat.techs.map((t) => t.name);
		list.push({
			id: `f:${cat.key}`,
			type: "folder",
			cat,
			isOpen,
			lines: lastCat ? "└─" : "├─",
			level: 1,
			pos: ci + 1,
			size: shown.length,
			count: filtering.value ? `${techs.length}/${cat.techs.length}` : cat.techs.length,
			preview:
				names.slice(0, PREVIEW_COUNT).join(" · ") +
				(names.length > PREVIEW_COUNT ? " …" : ""),
		});
		if (!isOpen) return;
		techs.forEach((tech, ti) => {
			const lastTech = ti === techs.length - 1;
			const selected = tech.name === props.selected;
			const branch = lastTech ? "└" : "├";
			list.push({
				id: `t:${tech.name}`,
				type: "tech",
				cat,
				tech,
				tag: tagOf(tech),
				selected,
				lines: (lastCat ? "    " : "│   ") + branch + (selected ? "─▸" : "──"),
				level: 2,
				pos: ti + 1,
				size: techs.length,
			});
		});
	});
	return list;
});

// Roving focus: only one row is tabbable
const focusedId = ref(null);
const tabbableId = computed(() => {
	const ids = rows.value.map((r) => r.id);
	if (ids.includes(focusedId.value)) return focusedId.value;
	const selectedId = `t:${props.selected}`;
	return ids.includes(selectedId) ? selectedId : ids[0];
});

const rowEls = {};
async function focusRow(id) {
	focusedId.value = id;
	await nextTick();
	rowEls[id]?.focus();
}

function activate(row) {
	focusedId.value = row.id;
	if (row.type === "folder") emit("toggle", row.cat.key);
	else emit("select", row.tech.name);
}

function onKeydown(event, row) {
	const list = rows.value;
	const i = list.findIndex((r) => r.id === row.id);
	const go = (index) => focusRow(list[Math.max(0, Math.min(list.length - 1, index))].id);
	switch (event.key) {
		case "ArrowDown":
			go(i + 1);
			break;
		case "ArrowUp":
			go(i - 1);
			break;
		case "Home":
			go(0);
			break;
		case "End":
			go(list.length - 1);
			break;
		case "ArrowRight":
			if (row.type !== "folder") return;
			if (!row.isOpen) emit("toggle", row.cat.key);
			else go(i + 1);
			break;
		case "ArrowLeft":
			if (row.type === "folder" && row.isOpen) emit("toggle", row.cat.key);
			else if (row.type === "tech") focusRow(`f:${row.cat.key}`);
			else return;
			break;
		case "Enter":
		case " ":
			activate(row);
			break;
		default:
			return;
	}
	event.preventDefault();
}
</script>

<template>
	<div class="tree">
		<div class="tree__tools">
			<label class="search">
				<span class="search__bg" aria-hidden="true"></span>
				<span class="search__prompt" aria-hidden="true">/</span>
				<input
					v-model="query"
					type="search"
					class="search__input"
					:placeholder="$t('Techs.search')"
					:aria-label="$t('Techs.searchLabel')"
					@keydown.esc="onSearchEscape"
				/>
				<button
					v-if="query"
					type="button"
					class="search__clear"
					:aria-label="$t('Techs.clearSearch')"
					@click="query = ''"
				>
					<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				</button>
			</label>
			<button
				type="button"
				class="tree__ai"
				:class="{ 'active-bar': showAi }"
				:aria-pressed="showAi"
				:title="$t('Techs.usedByAiHint')"
				@click="showAi = !showAi"
			>
				{{ $t("Techs.usedByAi") }}
			</button>
		</div>

		<div role="tree" :aria-label="$t('Techs.treeLabel')" class="tree__list">
			<div
				v-for="row in rows"
				:key="row.id"
				:ref="(el) => (rowEls[row.id] = el)"
				role="treeitem"
				class="tree__row"
				:class="[`tree__row--${row.type}`, { 'is-selected': row.selected }]"
				:aria-level="row.level"
				:aria-posinset="row.pos"
				:aria-setsize="row.size"
				:aria-expanded="row.type === 'folder' ? row.isOpen : undefined"
				:aria-selected="row.type === 'tech' ? row.selected : undefined"
				:tabindex="row.id === tabbableId ? 0 : -1"
				@click="activate(row)"
				@keydown="onKeydown($event, row)"
			>
				<span class="tree__lines" aria-hidden="true">{{ row.lines }}</span>

				<template v-if="row.type === 'folder'">
					<img
						:src="row.isOpen ? '/icons/disclosure-open.svg' : '/icons/disclosure-closed.svg'"
						:width="row.isOpen ? 10 : 8"
						:height="row.isOpen ? 8 : 10"
						alt=""
					/>
					<span>{{ $t(`Techs.folders.${row.cat.key}`) }}</span>
					<span v-if="!row.isOpen" class="tree__preview">{{ row.preview }}</span>
					<span class="tree__spacer"></span>
					<span class="tree__count">{{ row.count }}</span>
				</template>

				<template v-else>
					<span class="tree__name">{{ row.tech.name }}</span>
					<span class="tree__spacer"></span>
					<span
						class="tree__tag"
						:style="{ color: `var(--tag-${row.tag})` }"
						>{{ $t(`Techs.tags.${row.tag}`) }}</span
					>
				</template>
			</div>
		</div>
		<p v-if="!rows.length" class="tree__empty" role="status">{{ $t("Techs.noMatch") }}</p>

		<div role="group" :aria-label="$t('Techs.filterByTag')" class="tree__legend">
			<span class="tree__legend-title">{{ $t("Techs.usedAt") }}</span>
			<button
				v-for="tag in TAGS"
				:key="tag"
				type="button"
				class="tree__legend-tag"
				:class="{
					'is-active': activeTags.includes(tag),
					'is-dimmed': activeTags.length && !activeTags.includes(tag),
				}"
				:style="{ color: `var(--tag-${tag})` }"
				:aria-pressed="activeTags.includes(tag)"
				@click="toggleTag(tag)"
			>
				{{ $t(`Techs.tags.${tag}`) }}
			</button>
		</div>
	</div>
</template>

<style scoped>
.tree {
	box-sizing: border-box;
	padding: 14px 18px;
	display: flex;
	flex-direction: column;
	font-size: 13px;
}
.tree__list {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	/* room for focus outlines inside the scroll area */
	padding: 4px;
	margin: -4px;
}

.tree__row {
	height: 40px;
	box-sizing: border-box;
	padding: 0 8px;
	display: flex;
	align-items: center;
	gap: 8px;
	color: var(--text);
	cursor: pointer;
	white-space: nowrap;
	user-select: none;
}
.tree__row:focus-visible {
	outline-offset: -2px;
}
.tree__row--folder {
	color: var(--text-strong);
	font-weight: 700;
}
.tree__lines {
	color: var(--text-faint);
	white-space: pre;
	font-weight: 400;
}
.tree__row--tech:hover .tree__name {
	color: var(--text-strong);
}
.tree__row.is-selected {
	color: var(--cyan);
	font-weight: 700;
}
.tree__row.is-selected .tree__lines {
	color: var(--cyan);
}
.tree__row.is-selected .tree__name,
.tree__row.is-selected:hover .tree__name {
	color: var(--cyan);
	text-shadow: 0 0 12px rgba(34, 211, 238, 0.6);
}

.tree__preview {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 12px;
	font-weight: 400;
	color: var(--text-muted);
}
.tree__spacer {
	flex: 1;
}
.tree__count {
	font-size: 11px;
	font-weight: 400;
	color: var(--text-muted);
}
.tree__tag {
	font-size: 11px;
	font-weight: 400;
}

.tree__legend {
	flex-shrink: 0;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px 16px;
	margin-top: 8px;
	padding: 14px 8px 4px;
	border-top: 1px solid var(--divider);
	font-size: 11px;
}
.tree__legend-title {
	color: var(--text-muted);
}
/* Tags filter the tree: active = slanted bar in the tag's colour */
.tree__legend-tag {
	position: relative;
	height: 28px;
	padding: 0 2px;
	border: 0;
	background: transparent;
	font-size: 11px;
	cursor: pointer;
}
.tree__legend-tag.is-active {
	font-weight: 700;
}
.tree__legend-tag.is-active::after {
	content: "";
	position: absolute;
	left: 0;
	right: 0;
	bottom: 3px;
	height: 2px;
	background: currentColor;
	clip-path: polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%);
}
.tree__legend-tag.is-dimmed {
	opacity: 0.45;
}
.tree__empty {
	margin: 0;
	padding: 12px 8px;
	font-size: 12px;
	color: var(--text-muted);
}

/* ── Search + "used by ai" ─────────────────────────────────────── */
.tree__tools {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 10px;
}
.search {
	position: relative;
	flex: 1;
	min-width: 0;
	height: 36px;
	padding: 0 6px 0 12px;
	display: flex;
	align-items: center;
	gap: 8px;
}
/* Cut-corner fill on its own layer, so the focus outline isn't clipped */
.search__bg {
	position: absolute;
	inset: 0;
	background: var(--card);
	clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.search:focus-within {
	outline: 2px solid var(--cyan);
	outline-offset: 3px;
}
.search__prompt,
.search__input,
.search__clear {
	position: relative;
}
.search__prompt {
	color: var(--cyan);
	font-weight: 700;
}
.search__input {
	flex: 1;
	min-width: 0;
	height: 100%;
	border: 0;
	background: transparent;
	color: var(--text-strong);
	caret-color: var(--cyan);
	font: inherit;
	font-size: 13px;
}
.search__input:focus-visible {
	outline: none;
}
.search__input::placeholder {
	color: var(--text-muted);
}
.search__input::-webkit-search-cancel-button {
	display: none;
}
.search__clear {
	width: 28px;
	height: 28px;
	border: 0;
	background: transparent;
	color: var(--text-muted);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
}
.search__clear:hover {
	color: var(--text-strong);
}
.tree__ai {
	--bar-inset: 8px;
	--bar-bottom: 6px;
	flex-shrink: 0;
	height: 40px;
	padding: 0 8px;
	border: 0;
	background: transparent;
	color: var(--text-muted);
	font-size: 12px;
	white-space: nowrap;
	cursor: pointer;
}
.tree__ai.active-bar {
	color: var(--cyan);
}
</style>
