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
    <h2 v-if="value" :style="{ 'margin-left': spacing * 30 + 'px' }">
      {{ "• " + key }}
    </h2>
    <p v-else :style="{ 'margin-left': spacing * 30 + 'px' }">
      {{ "• " + key }}
    </p>
    <TechTreeNode :node="node[key]" :spacing="spacing + 1" :key="index" />
  </div>
</template>
