<script setup>
defineProps({
	icon: { type: String, required: true },
	label: { type: String, required: true },
	// Its window is open
	active: { type: Boolean, default: false },
	// Another icon is hovered
	dimmed: { type: Boolean, default: false },
});
defineEmits(["open"]);
</script>

<template>
	<button
		type="button"
		class="desk-icon"
		:class="{ 'is-active': active, 'is-dimmed': dimmed }"
		:aria-pressed="active"
		@click="$emit('open')"
	>
		<img :src="icon" width="48" height="48" alt="" class="desk-icon__glyph" />
		<span class="desk-icon__label">{{ label }}</span>
	</button>
</template>

<style scoped>
.desk-icon {
	width: 88px;
	padding: 6px 0;
	border: 0;
	background: transparent;
	cursor: pointer;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	color: var(--text);
	font-family: var(--font-mono);
	transition: opacity 0.15s ease, color 0.15s ease;
}
.desk-icon__glyph {
	display: block;
	transition: filter 0.15s ease;
}
.desk-icon__label {
	font-size: 12px;
	letter-spacing: 0.02em;
}

.desk-icon:hover,
.desk-icon:focus-visible,
.desk-icon.is-active {
	color: var(--cyan);
}
.desk-icon:hover .desk-icon__glyph,
.desk-icon:focus-visible .desk-icon__glyph {
	filter: var(--glow-hover);
}
.desk-icon.is-active .desk-icon__glyph {
	filter: var(--glow);
}
.desk-icon.is-dimmed {
	opacity: 0.4;
}

@media (max-width: 767px) {
	.desk-icon {
		width: 64px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.desk-icon,
	.desk-icon__glyph {
		transition: none;
	}
}
</style>
