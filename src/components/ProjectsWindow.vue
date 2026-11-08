<script setup>
import { computed, ref } from "vue";
import { $t } from "../i18n";
import { PROJECT_FILTERS, projects } from "../projects";
import ProjectCard from "./ProjectCard.vue";

const active = ref("all");

const countFor = (filter) =>
	filter === "all"
		? projects.length
		: projects.filter((p) => p.tags.includes(filter)).length;

// Empty categories stay hidden until a project uses them
const filters = computed(() =>
	PROJECT_FILTERS.map((key) => ({ key, count: countFor(key) })).filter(
		(f) => f.count > 0
	)
);

const shown = computed(() =>
	active.value === "all"
		? projects
		: projects.filter((p) => p.tags.includes(active.value))
);
const featured = computed(() => shown.value.find((p) => p.featured));
const others = computed(() => shown.value.filter((p) => !p.featured));
</script>

<template>
	<!-- The wrapper is the size container; .projects reacts to it -->
	<div class="projects-root">
		<div class="projects">
			<aside class="projects__filters" :aria-label="$t('Projects.filter')">
				<span class="projects__filters-title" aria-hidden="true">{{ $t("Projects.filter") }}</span>
				<button
					v-for="f in filters"
					:key="f.key"
					type="button"
					class="projects__filter"
					:class="{ 'is-active': active === f.key }"
					:aria-pressed="active === f.key"
					@click="active = f.key"
				>
					<img
						v-if="active === f.key"
						src="/icons/marker.svg"
						width="8"
						height="10"
						alt=""
					/>
					<span v-else class="projects__marker-space"></span>
					{{ $t(`Projects.filters.${f.key}`) }}
					<span class="projects__spacer"></span>
					<span class="projects__count">{{ f.count }}</span>
				</button>
			</aside>

			<div class="projects__list">
				<ProjectCard v-if="featured" :project="featured" featured />
				<div v-if="others.length" class="projects__grid">
					<ProjectCard v-for="p in others" :key="p.key" :project="p" />
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.projects-root {
	container: projects / inline-size;
	min-height: 100%;
	display: flex;
}
.projects {
	flex: 1;
	display: flex;
}

.projects__filters {
	width: 190px;
	flex-shrink: 0;
	box-sizing: border-box;
	padding: 16px 10px;
	border-right: 1px solid var(--divider);
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.projects__filters-title {
	padding: 0 10px 8px;
	font-size: 11px;
	color: var(--text-muted);
	letter-spacing: 0.08em;
	text-transform: uppercase;
}
.projects__filter {
	height: 40px;
	flex-shrink: 0;
	padding: 0 10px;
	border: 0;
	background: transparent;
	color: var(--text);
	font-size: 13px;
	text-align: left;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 10px;
	white-space: nowrap;
}
.projects__filter:hover {
	color: var(--text-strong);
}
.projects__filter.is-active {
	color: var(--cyan);
	font-weight: 700;
}
.projects__marker-space {
	width: 8px;
}
.projects__spacer {
	flex: 1;
}
.projects__count {
	color: var(--text-muted);
}
.projects__filter.is-active .projects__count {
	color: inherit;
}

.projects__list {
	flex: 1;
	min-width: 0;
	box-sizing: border-box;
	padding: 22px 24px;
	display: flex;
	flex-direction: column;
	gap: 16px;
}
.projects__grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16px;
}

/* Narrow window (tablet portrait, phones): filters become a row on top */
@container projects (max-width: 620px) {
	.projects {
		flex-direction: column;
	}
	.projects__filters {
		width: auto;
		padding: 8px 10px;
		border-right: 0;
		border-bottom: 1px solid var(--divider);
		flex-direction: row;
		overflow-x: auto;
	}
	.projects__filters-title {
		display: none;
	}
	.projects__filter .projects__spacer {
		flex: 0;
	}
	.projects__list {
		padding: 16px;
	}
	.projects__grid {
		grid-template-columns: minmax(0, 1fr);
	}
}
</style>
