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

// VUE-COMMAND STUFF

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

// WINBOX STUFF

const globalOptions = {
  class: "modern",
  hidden: true,
  minwidth: "500px",
  minheight: "200px",
};

const contactRef = ref();
const contactOptions = {
  title: "Formulaire de contact",
  onclose: function (force) {
    contactRef.value.winbox.hide(true);
    return true;
  },
  ...globalOptions,
};

const CVRef = ref();
const CVOptions = {
  title: "Curriculum Vitae",
  onclose: function (force) {
    CVRef.value.winbox.hide(true);
    return true;
  },
  ...globalOptions,
};

const terminalRef = ref();
const terminalOptions = {
  title: "bash: durandarthur@MONOLITH",
  onclose: function (force) {
    terminalRef.value.winbox.hide(true);
    return true;
  },
  ...globalOptions,
};

const techsRef = ref();
const techsOptions = {
  title: "Technologies",
  onclose: function (force) {
    techsRef.value.winbox.hide(true);
    return true;
  },
  ...globalOptions,
};

// OTHER STUFF

function onIconClicked(ref) {
  ref?.winbox?.hide(!ref?.winbox?.hidden);
}

function onBarIconClicked(ref) {
  ref?.winbox?.minimize(!ref?.winbox?.min);
}
</script>

<template>
  <body>
    <Renderer ref="renderer" pointer :resize="'window'" class="testg">
      <Camera :position="{ z: 7 }" />
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
        <template #image>
          <img src="/mail.png" alt="" class="hover:p-4 hover:rounded-3xl" />
        </template>
      </DesktopIcon>

      <DesktopIcon @iconClicked="onIconClicked(CVRef)">
        <template #text> CV </template>
        <template #image>
          <img
            src="/resume.png"
            alt=""
            class="hover:px-[1rem] hover:py-[1.28rem] hover:rounded-3xl"
          />
        </template>
      </DesktopIcon>

      <DesktopIcon @iconClicked="onIconClicked(terminalRef)">
        <template #text> Terminal </template>
        <template #image>
          <img src="/terminal.png" alt="" class="hover:p-4 hover:rounded-3xl" />
        </template>
      </DesktopIcon>

      <DesktopIcon @iconClicked="onIconClicked(techsRef)">
        <template #text> Techs </template>
        <template #image>
          <img
            src="/atomic.png"
            alt=""
            class="hover:px-[1rem] hover:py-[1.14rem] hover:rounded-3xl"
          />
        </template>
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

    <footer
      class="h-[7%] bg-gray-950 rounded-2xl fixed bottom-0 flex w-full justify-center gap-x-10"
    >
      <img
        v-if="!contactRef?.winbox?.hidden"
        src="/mail.png"
        alt=""
        @click="onBarIconClicked(contactRef)"
      />
      <img
        v-if="!CVRef?.winbox?.hidden"
        src="/resume.png"
        alt=""
        @click="onBarIconClicked(CVRef)"
      />
      <img
        v-if="!terminalRef?.winbox?.hidden"
        src="/terminal.png"
        alt=""
        @click="onBarIconClicked(terminalRef)"
      />
      <img
        v-if="!techsRef?.winbox?.hidden"
        src="/atomic.png"
        alt=""
        @click="onBarIconClicked(techsRef)"
      />
    </footer>
  </body>
</template>

<style scoped>
img {
  filter: invert(72%) sepia(49%) saturate(4291%) hue-rotate(148deg)
    brightness(106%) contrast(100%);
}
img:hover {
  filter: none;
  background-color: #04d9ff;
  overflow: visible;
}

footer img {
  margin: 10px;
  padding: 1rem;
  background-color: #04d9ff;
  filter: none;
  border-radius: 1.2rem;
  overflow: visible;
}

footer img:hover {
  cursor: pointer;
  filter: brightness(110%);
}
</style>
