<script setup>
const props = defineProps({
	node: {
		type: Object,
		required: true,
	},
	spacing: {
		type: Number,
		default: 0,
	},
});
</script>

<template>
	<div v-for="(value, key, index) in node">
		<h2
			v-if="value"
			:style="{
				'margin-left': 'calc(calc(50% - 100px) + ' + spacing * 30 + 'px)',
			}"
		>
			{{ "‣ " + key }}
		</h2>
		<p
			v-else
			:style="{
				'margin-left': 'calc(calc(50% - 100px) + ' + spacing * 30 + 'px)',
			}"
		>
			{{ "• " + key }}
		</p>
		<TechTreeNode :node="node[key]" :spacing="spacing + 1" :key="index" />
	</div>
</template>

<style scoped>
* {
	background-color: #111316;
	color: aliceblue;
	font-family: "Roboto Mono", monospace;
}

h2 {
	font-weight: bold;
	color: #04d9ff;
}

h2:hover {
	cursor: default;
}

p:hover {
	/* color: #04d9ff; */
	cursor: default;
}
</style>
