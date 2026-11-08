<script setup>
import { computed } from "vue";
import { $t } from "../i18n";
import { CONTEXTS, NOTES, pairedWith, sinceOf, tagOf } from "../techs";

const props = defineProps({
	tech: { type: Object, required: true }, // { name, used, category }
	// Tree view: also suggest switching to the graph
	graphHint: { type: Boolean, default: false },
});
defineEmits(["select", "open-projects"]);

const tag = computed(() => tagOf(props.tech));
const since = computed(() => sinceOf(props.tech));
const paired = computed(() => pairedWith(props.tech));

const contexts = computed(() =>
	props.tech.used.map((key) => {
		const ctx = CONTEXTS[key];
		const noteKey = NOTES[props.tech.name]?.[key];
		return {
			key,
			...ctx,
			label: ctx.nameKey ? $t(ctx.nameKey) : ctx.name,
			text: $t(noteKey ?? ctx.textKey),
		};
	})
);
</script>

<template>
	<div class="details">
		<span class="details__path">
			{{ $t("App.apps.techs.label") }}{{ $t(`Techs.folders.${tech.category}`) }}
		</span>

		<div class="details__head">
			<h3 class="details__name">{{ tech.name }}</h3>
			<p v-if="tag || since" class="details__context">
				<span class="details__strong">{{ tag ? $t(`Techs.tagsLong.${tag}`) : "[unknown]" }}</span>
				<span class="details__sep" aria-hidden="true"> / </span>
				{{ $t("Techs.since").replace("{year}", since ?? "[redacted]") }}
			</p>
			<p v-else class="details__placeholder">
				<span class="details__strong">hobby</span>
			</p>
		</div>

		<section class="details__section">
			<h4 class="details__label">{{ $t("Techs.usedIn") }}</h4>
			<div
				v-for="ctx in contexts"
				:key="ctx.key"
				class="ctx frame frame--card frame--featured"
			>
				<div class="frame__body ctx__body">
					<div class="ctx__head">
						<button
							v-if="ctx.project"
							type="button"
							class="ctx__name ctx__name--link"
							:title="$t('Techs.openInProjects')"
							@click="$emit('open-projects')"
						>
							{{ ctx.label }}
						</button>
						<span v-else class="ctx__name">{{ ctx.label }}</span>
						<span class="ctx__spacer"></span>
						<a
							v-if="ctx.link"
							class="ctx__link"
							:href="ctx.link.href"
							target="_blank"
							rel="noopener noreferrer"
							>{{ $t(`Projects.links.${ctx.link.label}`) }} ↗</a
						>
						<span v-else-if="ctx.period" class="ctx__period">{{ ctx.period }}</span>
					</div>
					<p class="ctx__text">{{ ctx.text }}</p>
				</div>
			</div>
			<p v-if="!contexts.length" class="details__placeholder">[DATA EXPUNGED]</p>
		</section>

		<section v-if="paired.length" class="details__section">
			<h4 class="details__label">{{ $t("Techs.pairedWith") }}</h4>
			<p class="details__paired">
				<template v-for="(other, i) in paired" :key="other.name">
					<span v-if="i > 0" class="details__sep" aria-hidden="true"> / </span>
					<button type="button" class="details__tech-link" @click="$emit('select', other.name)">
						{{ other.name }}
					</button>
				</template>
			</p>
		</section>

		<span class="details__fill"></span>
		<p class="details__hint">
			{{ $t("Techs.hint") }}
			<template v-if="graphHint"> {{ $t("Techs.hintGraph") }}</template>
		</p>
	</div>
</template>

<style scoped>
.details {
	box-sizing: border-box;
	padding: 26px 28px;
	display: flex;
	flex-direction: column;
	gap: 18px;
}
.details__path {
	font-size: 11px;
	color: var(--text-muted);
}
.details__head {
	display: flex;
	flex-direction: column;
	gap: 10px;
}
.details__name {
	margin: 0;
	font-size: 26px;
	font-weight: 800;
	line-height: 1.15;
	color: var(--text-strong);
}
.details__context {
	margin: 0;
	font-size: 12px;
	color: var(--text-body);
}
.details__strong {
	color: var(--text-strong);
}
.details__sep {
	color: var(--text-faint);
}

.details__section {
	display: flex;
	flex-direction: column;
	gap: 10px;
}
.details__label {
	margin: 0;
	font-size: 10px;
	font-weight: 400;
	letter-spacing: 0.14em;
	color: var(--text-muted);
}
.details__placeholder {
	margin: 0;
	font-size: 12px;
	color: var(--text-muted);
}

/* Smaller card than in Projects: 10px cut, 7px mark */
.ctx {
	--cut: 10px;
	--mark: 7px;
}
.ctx__body {
	box-sizing: border-box;
	padding: 14px 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.ctx__head {
	display: flex;
	align-items: center;
	gap: 10px;
}
.ctx__name {
	font-size: 15px;
	font-weight: 700;
	color: var(--text-strong);
}
.ctx__name--link {
	padding: 0;
	border: 0;
	background: transparent;
	color: var(--cyan);
	font-family: inherit;
	cursor: pointer;
}
.ctx__name--link:hover {
	color: var(--cyan-300);
}
.ctx__spacer {
	flex: 1;
}
.ctx__link {
	font-size: 12px;
	color: var(--cyan);
	text-decoration: none;
	white-space: nowrap;
}
.ctx__link:hover {
	color: var(--cyan-300);
}
.ctx__period {
	font-size: 11px;
	color: var(--text-muted);
	white-space: nowrap;
}
.ctx__text {
	margin: 0;
	font-size: 12px;
	line-height: 1.65;
	color: var(--text-body);
	white-space: pre-line;
}

.details__paired {
	margin: 0;
	font-size: 13px;
	color: var(--text);
}
.details__tech-link {
	padding: 0;
	border: 0;
	background: transparent;
	color: var(--cyan);
	font: inherit;
	cursor: pointer;
}
.details__tech-link:hover {
	color: var(--cyan-300);
}

.details__fill {
	flex: 1;
}
.details__hint {
	margin: 0;
	font-size: 11px;
	line-height: 1.6;
	color: var(--text-muted);
}
</style>
