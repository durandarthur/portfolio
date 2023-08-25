<script setup>
defineEmits(["iconClicked"]);
</script>

<template>
  <div class="m-8 w-24">
    <div
      class="mb-4 hover:cursor-pointer overflow-hidden"
      @click="$emit('iconClicked')"
    >
      <slot name="image"></slot>
      <!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">
                <path d="M0,0h1v1H0" fill="#04D9FF"/>
            </svg> -->
    </div>
    <p
      class="text-xl text-center text-white drop-shadow select-none pointer-events-none"
    >
      <slot name="text"></slot>
    </p>
  </div>
</template>

<style lang="css" scoped>
p {
  font-family: "Roboto Mono", monospace;
}
</style>
