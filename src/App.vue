<script setup>
import { ref } from 'vue'
import { VueWinBox } from 'vue-winbox';
import DesktopIcon from './components/DesktopIcon.vue';

const globalOptions = {
  class: 'modern',
  hidden: true,
  onclose: function(force){
    this.hide(true);
    return true;
  },
}

const contactRef = ref();
const contactOptions = {
  title: 'Test',
  ...globalOptions
}

const CVRef = ref();
const CVOptions = {
  title: 'Test',
  ...globalOptions
}

const terminalRef = ref();
const terminalOptions = {
  title: 'Test3',
  ...globalOptions
}

function onIconClicked(ref) {
  ref?.winbox?.hide(!ref?.winbox?.hidden)
}
</script>

<template>
  <main class="flex flex-col content-start flex-wrap max-h-[85%]">
    <DesktopIcon @iconClicked="onIconClicked(contactRef)">
      <template #text>
        Contact
      </template>
    </DesktopIcon>

    <DesktopIcon @iconClicked="onIconClicked(CVRef)">
      <template #text>
        CV
      </template>
    </DesktopIcon>

    <DesktopIcon @iconClicked="onIconClicked(terminalRef)">
      <template #text>
        Terminal
      </template>
    </DesktopIcon>

    <VueWinBox ref="contactRef" :options="contactOptions" @onmove="onMove">
      <div>Test</div>
    </VueWinBox>

    <VueWinBox ref="CVRef" :options="CVOptions" @onmove="onMove">
      <div>Test2</div>
    </VueWinBox>

    <VueWinBox ref="terminalRef" :options="terminalOptions" @onmove="onMove">
      <div>Test3</div>
    </VueWinBox>
  </main>

  <footer class="h-[10%] bg-white rounded-2xl m-2 fixed bottom-0">
    <div class="h-full aspect-square border-r-2"></div>
  </footer>
  
</template>

<style scoped>
</style>
