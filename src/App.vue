<script setup>
import { onMounted, ref } from "vue";
import VueCommand, {
	createQuery,
	createStdout,
	listFormatter,
	newDefaultHistory,
	textFormatter,
} from "vue-command";
import "vue-command/dist/vue-command.css";
import { VueWinBox } from "vue-winbox";
import ContactForm from "./components/ContactForm.vue";
import DesktopIcon from "./components/DesktopIcon.vue";
import TechTreeNode from "./components/TechTreeNode.vue";
import { bioHTML, socialsHTML, techs, timeline } from "./data";
import { techsFormatter, timelineFormatter } from "./lib/formatters";

// THREE/TROIS.JS STUFF

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

const renderer = ref(null);
const box = ref(null);
const light = ref(null);
const particles = ref([]);

function handleMouseMove(event) {
	box.value.mesh.rotation.x =
		2 * (event.clientY / document.body.clientHeight) - 1;
	box.value.mesh.rotation.y =
		2 * (event.clientX / document.body.clientWidth) - 1;
	light.value.light.position.x = event.clientX;
	light.value.light.position.y = event.clientY;
	light.value.light.position.z = 3;
}

onMounted(() => {
	// alert("en travaux !");
	for (let i = 0; i < particlesAmount; i++) {
		const particle = particles.value[i].mesh;

		console.log(particle);

		particles.value[i].mesh.position.x =
			document.body.clientWidth * Math.random() - document.body.clientWidth / 2;
		particles.value[i].mesh.position.y =
			document.body.clientHeight * Math.random() -
			document.body.clientHeight / 2;

		// particle.position.x = Math.floor(document.body.clientWidth * Math.random());
		// particle.position.y = Math.floor(
		// 	document.body.clientHeight * Math.random()
		// );
		// particle.position.z = Math.floor(Math.random() * 10);

		// particle.rotation.x = Math.floor(360 * Math.random());
		// particle.rotation.y = Math.floor(360 * Math.random());
		// particle.rotation.z = Math.floor(360 * Math.random());
	}

	renderer?.value?.onBeforeRender(() => {
		document.onmousemove = handleMouseMove;

		for (let i = 0; i < particlesAmount; i++) {
			console.log(particles);
			const particle = particles.value[i].mesh;

			// console.log(document.body.clientWidth);
			// console.log(document.body.clientHeight);

			// console.log(particle);
			// if (particle.position.x >= document.body.clientWidth) {
			// 	particle.position.x -= document.body.clientWidth;
			// } else {
			// 	particle.position.x += 0.01;
			// }

			// if (particle.position.y >= document.body.clientHeight) {
			// 	particle.position.y -= document.body.clientHeight;
			// } else {
			// 	particle.position.y += 0.01;
			// }

			// particles.value[i].mesh.position.x += i / 100;
			// particles.value[i].mesh.position.y += i / 100;

			particle.rotation.x += 0.01;
			particle.rotation.y += 0.01;
			particle.rotation.z += 0.01;
		}
	});
});

// onBeforeUpdate(() => {
// 	particles.value = [];
// });

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
	width: "60%",
	height: "60%",
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
	maxwidth: "1400px",
};

const creditsRef = ref();
const creditsOptions = {
	title: "À propos",
	modal: true,
	onclose: function (force) {
		creditsRef.value.winbox.hide(true);
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

const time = ref(new Date().toLocaleTimeString());

function setTime() {
	time.value = new Date().toLocaleTimeString();
}

setInterval(() => setTime(), 1000);

const particlesAmount = 100;
</script>

<template>
	<body>
		<Renderer ref="renderer" pointer :resize="'window'" class="testg">
			<Camera :position="{ z: 1500 }" :aspect="16 / 9" />
			<Scene background="black">
				<PointLight ref="light" color="#00ffff" />
				<Box
					ref="box"
					:rotation="{ y: Math.PI / 4, z: Math.PI / 4 }"
					widthSegments="5"
					heightSegments="5"
					depthSegments="5"
					:size="100"
				>
					<BasicMaterial :props="{ wireframe: true }" color="#04D9FF" />
				</Box>
				<Tetrahedron
					v-for="i in particlesAmount"
					:key="i"
					ref="particles"
					:size="20"
					><BasicMaterial :props="{ wireframe: true }" color="#04D9FF"
				/></Tetrahedron>
			</Scene>
		</Renderer>
		<main class="flex">
			<div class="flex flex-col content-start flex-wrap w-screen h-[85vh]">
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
						<img
							src="/terminal.png"
							alt=""
							class="hover:p-4 hover:rounded-3xl"
						/>
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
			</div>

			<VueWinBox ref="contactRef" :options="contactOptions" @onmove="onMove">
				<ContactForm />
			</VueWinBox>

			<VueWinBox ref="CVRef" :options="CVOptions" @onmove="onMove">
				<iframe src="/CV_Arthur_Durand_2024.pdf" frameborder="0"></iframe>
			</VueWinBox>

			<VueWinBox ref="terminalRef" :options="terminalOptions" @onmove="onMove">
				<vue-command
					:commands="commands"
					:history="history"
					class="w-full h-full"
					font="Roboto Mono"
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

			<VueWinBox ref="creditsRef" :options="creditsOptions">
				<div class="w-full h-full bg-[#111316] text-white p-8">
					<h2 class="text-xl mb-4">
						Ce projet n'aurait pas été possible sans:
					</h2>
					<ul class="list-disc list-inside marker:text-[#04d9ff] mb-4">
						<li>
							<a
								href="https://github.com/wobsoriano/vue-winbox"
								class="underline underline-offset-2 hover:text-[#04d9ff]"
								>Vue-WinBox</a
							>
						</li>
						<li>
							<a
								href="https://github.com/ndabAP/vue-command"
								class="underline underline-offset-2 hover:text-[#04d9ff]"
								>Vue-Command</a
							>
						</li>
						<li>
							<a
								href="https://troisjs.github.io/"
								class="underline hover:text-[#04d9ff]"
								>Trois.js</a
							>
						</li>
					</ul>
					<h2 class="text-xl mb-4">Mentions légales:</h2>
					<p class="2xl:w-1/2 mb-4">
						Aucune de vos données ne sont collectées par ce site web, sauf si
						vous décidez d'envoyer votre mail dans le formulaire de contact.<br />
						Ceci est optionnel, et ne sert qu'à vous recontacter.
					</p>
					<h2 class="text-xl mb-4">
						Autres contacts (si le formulaire ne marche pas):
					</h2>
					<ul class="mb-4">
						<li class="flex mb-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="#04d9ff"
								viewBox="0 0 22 22"
								strokeWidth="{1.5}"
								stroke="#000000"
								class="w-6 h-6 mr-2"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
								/>
							</svg>

							<a
								href="mailto:durandarthur09@outlook.fr"
								class="underline underline-offset-2 hover:text-[#04d9ff]"
								>durandarthur09@outlook.fr</a
							>
						</li>
						<li class="flex mb-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="#04d9ff"
								viewBox="0 0 24 24"
								strokeWidth="{1.5}"
								stroke="#04d9ff"
								class="w-6 h-6 mr-2"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
								/>
							</svg>
							+33 6 95 64 96 09
						</li>
						<li class="flex">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								x="0px"
								y="0px"
								width="26"
								height="26"
								viewBox="0 0 192 192"
								class="mr-2"
							>
								<g
									fill="none"
									fill-rule="nonzero"
									stroke="none"
									stroke-width="1"
									stroke-linecap="butt"
									stroke-linejoin="miter"
									stroke-miterlimit="10"
									stroke-dasharray=""
									stroke-dashoffset="0"
									font-family="none"
									font-weight="none"
									font-size="none"
									text-anchor="none"
								>
									<path d="M0,192v-192h192v192z" fill="none"></path>
									<g fill="#04d9ff">
										<g id="surface1">
											<path
												d="M156,0h-120c-19.875,0 -36,16.125 -36,36v120c0,19.875 16.125,36 36,36h120c19.875,0 36,-16.125 36,-36v-120c0,-19.875 -16.125,-36 -36,-36zM59.36539,162.98077h-29.82693l-0.17307,-89.30769h29.82692zM43.70192,61.99038h-0.17308c-9.75,0 -16.03846,-6.72115 -16.03846,-15.08653c0,-8.56731 6.49039,-15.0577 16.41347,-15.0577c9.92308,0 16.00961,6.49038 16.21153,15.0577c0,8.36538 -6.31731,15.08653 -16.41346,15.08653zM162.77885,162.98077h-30.08654v-48.51923c0,-11.74039 -3.11538,-19.73077 -13.61538,-19.73077c-8.01923,0 -12.34615,5.39423 -14.42308,10.61538c-0.77885,1.875 -0.98077,4.44231 -0.98077,7.06731v50.56731h-30.23077l-0.17308,-89.30769h30.23077l0.17308,12.60577c3.86538,-5.97116 10.29808,-14.42308 25.70192,-14.42308c19.09616,0 33.37501,12.46154 33.37501,39.25961v51.86539z"
											></path>
										</g>
									</g>
								</g>
							</svg>
							<a
								href="https://www.linkedin.com/in/arthur-durand-developpeur-web/"
								class="underline underline-offset-2 hover:text-[#04d9ff]"
								>LinkedIn</a
							>
						</li>
					</ul>
					<p class="mt-16">
						Veuillez me signaler tout bug informatique rencontré sur ce site.
					</p>
					<p
						class="static bottom-0 right-0 m-4 text-[#04d9ff] version text-right"
					>
						<a
							href="https://github.com/durandarthur/portfolio"
							class="underline underline-offset-2"
							>PortfolioOS v.2.1</a
						>
					</p>
				</div>
			</VueWinBox>
		</main>

		<footer
			class="h-[90px] bg-gray-900 rounded-2xl fixed bottom-0 flex flex-row w-full justify-center items-center gap-x-10 mx-8 mb-8"
		>
			<div class="w-1/5 !justify-start">
				<span
					class="text-5xl rounded-3xl p-5 aspect-square text-center bg-[#04d9ff] text-gray-900 font-semibold hover:brightness-110 hover:cursor-pointer hover:text-white transition duration-300"
					@click="onIconClicked(creditsRef)"
					>ⓘ</span
				>
			</div>
			<div class="w-3/5">
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
			</div>

			<div class="w-1/5 !justify-end mr-8">
				<p class="select-none text-[#04d9ff] text-lg time">{{ time }}</p>
			</div>
		</footer>
	</body>
</template>

<style scoped>
img {
	filter: invert(72%) sepia(49%) saturate(4291%) hue-rotate(148deg)
		brightness(106%) contrast(100%);
	transition-duration: 0.2s;
	transition-property: padding;
}
img:hover {
	filter: none;
	background-color: #04d9ff;
	overflow: visible;
	transition-duration: 0.5s;
	transition-property: padding;
}

footer {
	width: calc(100% - 4rem);
}

footer div {
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}

footer div img {
	margin: 10px;
	padding: 1rem;
	background-color: #04d9ff;
	filter: none;
	border-radius: 1.2rem;
	overflow: visible;
	height: 100%;
}

footer img:hover {
	cursor: pointer;
	filter: brightness(110%);
}

ul,
.time,
.version {
	font-family: "Roboto Mono", monospace;
}
</style>
