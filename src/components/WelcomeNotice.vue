<script setup>
import { $t } from "../i18n";

defineEmits(["open-cv", "dismiss"]);
</script>

<template>
	<aside class="notice frame" :aria-label="$t('Notice.label')">
		<div class="frame__body notice__body">
			<div class="notice__head">
				<span class="notice__kicker">{{ $t("Notice.kicker") }}</span>
				<button
					type="button"
					class="notice__dismiss"
					:aria-label="$t('Notice.dismiss')"
					@click="$emit('dismiss')"
				>
					<svg
						aria-hidden="true"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					>
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				</button>
			</div>
			<p class="notice__title">{{ $t("Notice.title") }}</p>
			<p class="notice__text">{{ $t("Notice.text") }}</p>
			<div class="notice__actions">
				<!-- Old rounded button style, not restyled yet (see design handoff) -->
				<button type="button" class="notice__btn" @click="$emit('open-cv')">
					{{ $t("Notice.openCv") }}
				</button>
			</div>
		</div>
	</aside>
</template>

<style scoped>
.notice {
	position: absolute;
	right: 28px;
	top: 28px;
	width: 320px;
	z-index: 1;
}
.notice__body {
	box-sizing: border-box;
	padding: 18px 18px 18px 20px;
	display: flex;
	flex-direction: column;
	gap: 12px;
}
.notice__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.notice__kicker {
	font-size: 11px;
	color: var(--text-muted);
	letter-spacing: 0.08em;
	text-transform: uppercase;
}
/* 28px visual size from the mockup, 44px hit area */
.notice__dismiss {
	width: 44px;
	height: 44px;
	margin: -8px -8px -8px 0;
	border: 0;
	background: transparent;
	color: var(--text-muted);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
}
.notice__dismiss:hover {
	color: var(--text-strong);
}
.notice__title {
	font-size: 15px;
	font-weight: 700;
	color: var(--text-strong);
}
.notice__text {
	font-size: 13px;
	line-height: 1.55;
	color: var(--text-body);
}
.notice__actions {
	display: flex;
	gap: 8px;
}
.notice__btn {
	height: 36px;
	padding: 0 14px;
	border: 0;
	border-radius: 9px;
	background: var(--cyan);
	color: var(--on-cyan);
	font-size: 13px;
	font-weight: 700;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
}
.notice__btn:hover {
	background: var(--cyan-300);
}

/* Phones: full width, above the taskbar */
@media (max-width: 767px) {
	.notice {
		top: auto;
		right: 12px;
		left: 12px;
		bottom: 88px;
		width: auto;
	}
}
</style>
