<script setup>
import { ref, onMounted } from "vue";
import { VueWinBox } from "vue-winbox";
import DesktopIcon from "./components/DesktopIcon.vue";
import TechTreeNode from "./components/TechTreeNode.vue";
import VueCommand, {
  createQuery,
  createStdout,
  newDefaultHistory,
  textFormatter,
  listFormatter,
} from "vue-command";
import { timelineFormatter, techsFormatter } from "./lib/formatters";
import "vue-command/dist/vue-command.css";
import { bioHTML, socialsHTML, timeline, techs } from "./data";
import ContactForm from "./components/ContactForm.vue";

// THREE/TROIS.JS STUFF

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

const renderer = ref(null);
const box = ref(null);

function handleMouseMove(event) {
  box.value.mesh.rotation.x =
    2 * (event.clientY / document.body.clientHeight) - 1;
  box.value.mesh.rotation.y =
    2 * (event.clientX / document.body.clientWidth) - 1;
}

onMounted(() => {
  renderer?.value?.onBeforeRender(() => {
    document.onmousemove = handleMouseMove;
  });
});

// WINBOX STUFF

const history = ref(newDefaultHistory());
const commands = {
  bio: () => createStdout(textFormatter(bioHTML, true)),
  clear: () => {
    // "splice" is necessary since Vue.js loses its reactivity if array is set to empty
    history.value.splice(0, history.value.length);
    return createQuery();
  },
  help: () => {
    const list = Object.keys(commands);
    return createStdout(listFormatter(...list));
  },
  techs: () =>
    createStdout(
      textFormatter("<pre>" + techsFormatter(techs) + "</pre>", true)
    ),
  timeline: () => createStdout(timelineFormatter(timeline)),
  socials: () => createStdout(textFormatter(socialsHTML, true)),
};

const globalOptions = {
  class: "modern",
  hidden: true,
  minwidth: "500px",
  minheight: "200px",
  onclose: function (force) {
    this.hide(true);
    return true;
  },
};

const contactRef = ref();
const contactOptions = {
  title: "Formulaire de contact",
  ...globalOptions,
};

const CVRef = ref();
const CVOptions = {
  title: "Curriculum Vitae",
  ...globalOptions,
};

const terminalRef = ref();
const terminalOptions = {
  title: "bash: durandarthur@MONOLITH",
  ...globalOptions,
};

const techsRef = ref();
const techsOptions = {
  title: "Technologies",
  ...globalOptions,
};

// OTHER STUFF

function onIconClicked(ref) {
  ref?.winbox?.hide(!ref?.winbox?.hidden);
}
</script>

<template>
  <body>
    <Renderer ref="renderer" pointer :resize="'window'" class="testg">
      <Camera :position="{ z: 10 }" />
      <Scene background="black">
        <Box
          ref="box"
          :rotation="{ y: Math.PI / 4, z: Math.PI / 4 }"
          widthSegments="5"
          heightSegments="5"
          depthSegments="5"
        >
          <BasicMaterial :props="{ wireframe: true }" color="#04D9FF" />
        </Box>
      </Scene>
    </Renderer>
    <main class="flex flex-col content-start flex-wrap">
      <DesktopIcon @iconClicked="onIconClicked(contactRef)">
        <template #text> Contact </template>
      </DesktopIcon>

      <DesktopIcon @iconClicked="onIconClicked(CVRef)">
        <template #text> CV </template>
      </DesktopIcon>

      <DesktopIcon @iconClicked="onIconClicked(terminalRef)">
        <template #text> Terminal </template>
      </DesktopIcon>

      <DesktopIcon @iconClicked="onIconClicked(techsRef)">
        <template #text> Technologies </template>
      </DesktopIcon>

      <VueWinBox ref="contactRef" :options="contactOptions" @onmove="onMove">
        <ContactForm />
      </VueWinBox>

      <VueWinBox ref="CVRef" :options="CVOptions" @onmove="onMove">
        <iframe
          src="https://durandarthur.vercel.app/CV_Arthur_Durand_2022.pdf"
          frameborder="0"
        ></iframe>
      </VueWinBox>

      <VueWinBox ref="terminalRef" :options="terminalOptions" @onmove="onMove">
        <vue-command
          :commands="commands"
          :history="history"
          class="w-full h-full"
        >
          <template #bar>
            <div></div>
          </template>
          <template #prompt>
            durandarthur@MONOLITH:~/code/personal/portfolio$&nbsp;
          </template>
        </vue-command>
      </VueWinBox>

      <VueWinBox ref="techsRef" :options="techsOptions" @onMove="onMove">
        <TechTreeNode :node="techs" />
      </VueWinBox>
    </main>

    <!-- <footer class="h-[10%] bg-white rounded-2xl m-2 fixed bottom-0">
    <div class="h-full aspect-square border-r-2"></div>
  </footer> -->
  </body>
</template>

<style scoped></style>
