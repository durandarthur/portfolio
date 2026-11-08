<script setup>
import { computed, nextTick, ref } from "vue";
import { $t } from "../i18n";
import { CATEGORIES, TAGS, tagOf } from "../techs";

const props = defineProps({
	selected: { type: String, required: true }, // tech name
	open: { type: Array, required: true }, // category keys
});
const emit = defineEmits(["select", "toggle"]);

const PREVIEW_COUNT = 3;

// Flat list of visible rows, drawn with real tree characters
const rows = computed(() => {
	const list = [];
	CATEGORIES.forEach((cat, ci) => {
		const lastCat = ci === CATEGORIES.length - 1;
		const isOpen = props.open.includes(cat.key);
		const names = cat.techs.map((t) => t.name);
		list.push({
			id: `f:${cat.key}`,
			type: "folder",
			cat,
			isOpen,
			lines: lastCat ? "└─" : "├─",
			level: 1,
			pos: ci + 1,
			size: CATEGORIES.length,
			preview:
				names.slice(0, PREVIEW_COUNT).join(" · ") +
				(names.length > PREVIEW_COUNT ? " …" : ""),
		});
		if (!isOpen) return;
		cat.techs.forEach((tech, ti) => {
			const lastTech = ti === cat.techs.length - 1;
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
				size: cat.techs.length,
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
					<span class="tree__count">{{ row.cat.techs.length }}</span>
				</template>

				<template v-else>
					<span class="tree__name">{{ row.tech.name }}</span>
					<span class="tree__spacer"></span>
					<span
						v-if="row.tag"
						class="tree__tag"
						:style="{ color: `var(--tag-${row.tag})` }"
						>{{ $t(`Techs.tags.${row.tag}`) }}</span
					>
					<span v-else class="tree__tag tree__tag--unknown">hobby</span>
				</template>
			</div>
		</div>

		<div class="tree__legend">
			<span class="tree__legend-title">{{ $t("Techs.usedAt") }}</span>
			<span v-for="tag in TAGS" :key="tag" :style="{ color: `var(--tag-${tag})` }">
				{{ $t(`Techs.tags.${tag}`) }}
			</span>
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
.tree__tag--unknown {
	color: var(--text-muted);
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
</style>
