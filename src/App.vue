<script setup>
import { ref } from 'vue'
import { VueWinBox } from 'vue-winbox';
import DesktopIcon from './components/DesktopIcon.vue';
import VueCommand, { createQuery, createStdout, newDefaultHistory, textFormatter, listFormatter } from "vue-command";
import { timelineFormatter } from "./lib/formatters";
import "vue-command/dist/vue-command.css";
import { bioHTML, socialsHTML, timeline } from "./data";

const history = ref(newDefaultHistory())
const commands = {
  "hello-world": () => createStdout("Hello world"),
  bio: () => createStdout(textFormatter(bioHTML, true)),
  clear: () => {
    // "splice" is necessary since Vue.js loses its reactivity if array is set to empty
    history.value.splice(0, history.value.length)
    return createQuery()
  },
  help: () => {
    const list = Object.keys(commands);
    return createStdout(listFormatter(...list));
  },
  timeline: () => createStdout(timelineFormatter(timeline)),
  socials: () => createStdout(textFormatter(socialsHTML, true)),
}

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
  title: 'Formulaire de contact',
  ...globalOptions
}

const CVRef = ref();
const CVOptions = {
  title: 'Curriculum Vitae',
  ...globalOptions
}

const terminalRef = ref();
const terminalOptions = {
  title: 'bash: durandarthur@MONOLITH',
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
      <iframe src="https://durandarthur.vercel.app/CV_Arthur_Durand_2022.pdf" frameborder="0"></iframe>
    </VueWinBox>

    <VueWinBox ref="terminalRef" :options="terminalOptions" @onmove="onMove">
      <vue-command :commands="commands" :history="history" class="w-full h-full">
        <template #bar>
          <div></div>
        </template>
        <template #prompt>
          durandarthur@MONOLITH:~/code/personal/portfolio$&nbsp;
        </template>
      </vue-command>
    </VueWinBox>
  </main>

  <footer class="h-[10%] bg-white rounded-2xl m-2 fixed bottom-0">
    <div class="h-full aspect-square border-r-2"></div>
  </footer>
  
</template>

<style scoped>
</style>
