<script setup>
import { computed } from "vue";
import { $t } from "../i18n";

const props = defineProps({
	project: { type: Object, required: true },
	featured: { type: Boolean, default: false },
});

const name = computed(() =>
	props.project.nameKey ? $t(props.project.nameKey) : props.project.name
);
const meta = computed(() =>
	props.project.metaKey ? $t(props.project.metaKey) : props.project.meta
);
</script>

<template>
	<div class="card frame frame--card" :class="{ 'frame--featured': featured, 'is-featured': featured }">
		<article class="frame__body card__body">
			<div class="card__media frame frame--image">
				<div class="frame__body card__media-body">
					<img
						v-if="project.image"
						:src="project.image"
						:alt="$t('Projects.screenshotAlt').replace('{name}', name)"
						loading="lazy"
					/>
					<span v-else class="card__placeholder">[screenshot]</span>
				</div>
			</div>

			<div class="card__text">
				<div class="card__head">
					<span v-if="featured" class="tag-slanted">{{ $t("Projects.featured") }}</span>
					<h3 class="card__title">{{ name }}</h3>
					<span class="card__spacer"></span>
					<a
						v-if="featured && project.link"
						class="card__link"
						:href="project.link.href"
						target="_blank"
						rel="noopener noreferrer"
						>{{ $t(`Projects.links.${project.link.label}`) }} ↗</a
					>
					<span v-else-if="meta" class="card__meta">{{ meta }}</span>
				</div>
				<p class="card__desc">{{ $t(`Projects.${project.key}.desc`) }}</p>
				<p class="card__stack">
					<template v-for="(tech, i) in project.stack" :key="tech">
						<span v-if="i > 0" class="card__sep" aria-hidden="true"> / </span>
						<span>{{ tech }}</span>
					</template>
				</p>
				<a
					v-if="!featured && project.link"
					class="card__link"
					:href="project.link.href"
					target="_blank"
					rel="noopener noreferrer"
					>{{ $t(`Projects.links.${project.link.label}`) }} ↗</a
				>
			</div>
		</article>
	</div>
</template>

<style scoped>
.card__body {
	box-sizing: border-box;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 10px;
}
.is-featured .card__body {
	padding: 18px;
	flex-direction: row;
	gap: 20px;
}

.card__media {
	height: 120px;
	flex-shrink: 0;
}
.is-featured .card__media {
	width: 250px;
	height: 168px;
}
.card__media-body {
	display: flex;
	align-items: center;
	justify-content: center;
	background:
		radial-gradient(circle, rgba(34, 211, 238, 0.35) 0 1px, transparent 1.5px) 0 0 / 10px 10px,
		#0a1220;
}
.card__media-body img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.card__placeholder {
	font-size: 12px;
	color: var(--text-muted);
}

.card__text {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 10px;
}
.is-featured .card__text {
	gap: 12px;
}
.card__head {
	display: flex;
	align-items: center;
	gap: 8px;
}
.is-featured .card__head {
	gap: 12px;
}
.card__title {
	margin: 0;
	font-size: 16px;
	font-weight: 800;
	color: var(--text-strong);
}
.is-featured .card__title {
	font-size: 20px;
}
.card__spacer {
	flex: 1;
}
.card__meta {
	font-size: 11px;
	color: var(--text-muted);
	white-space: nowrap;
}
.card__desc {
	margin: 0;
	font-size: 13px;
	line-height: 1.6;
	color: var(--text-body);
}
.card__stack {
	margin: 0;
	font-size: 12px;
	color: var(--text-tag);
}
.card__sep {
	color: var(--text-faint);
}
.card__link {
	align-self: flex-start;
	font-size: 12px;
	color: var(--cyan);
	text-decoration: none;
	white-space: nowrap;
}
.card__link:hover {
	color: var(--cyan-300);
}

/* Narrow window: the featured card stacks like the others */
@container projects (max-width: 560px) {
	.is-featured .card__body {
		flex-direction: column;
		gap: 14px;
	}
	.is-featured .card__media {
		width: auto;
	}
}
</style>
