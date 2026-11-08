<script setup>
import { gsap } from "gsap";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from "vue";
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
import ProjectCard from "./components/ProjectCard.vue";
import Taskbar from "./components/Taskbar.vue";
import TechTreeNode from "./components/TechTreeNode.vue";
import WelcomeNotice from "./components/WelcomeNotice.vue";
import { getBioHTML, getTechs, getTimeline, socialsHTML } from "./data";
import { $t, getCvUrl, lang } from "./i18n";
import { techsFormatter, timelineFormatter } from "./lib/formatters";
import {
	anyVisible,
	closeWindow,
	focusWindow,
	focusedKey,
	isOpenHere,
	isVisible,
	minimizeWindow,
	toggleFromDesktop,
} from "./lib/windows";

const isMobile = () => window.innerWidth < 500;

// THREE/TROIS.JS STUFF

const renderer = ref(null);
const camera = ref(null);
const box = ref(null);
const light = ref(null);
const particles = ref(null);
const meshKey = ref(0);

const particlesAmount = ref(1000);
const mouseEffectRange = ref(250);
const mouseEffectAmplitude = ref(1);

const particlesStates = ref([]);
const targetPositions = ref([]);

let hoverInterval;
let hoverTimeout;
let isHovering;

let lastOpened;

function handleMouseMove(event) {
	box.value.mesh.rotation.x =
		2 * (event.clientY / document.body.clientHeight) - 1;
	box.value.mesh.rotation.y =
		2 * (event.clientX / document.body.clientWidth) - 1;

	light.value.light.position.x = event.clientX;
	light.value.light.position.y = event.clientY;
	light.value.light.position.z = 3;

	const mouseX = event.clientX - document.body.clientWidth / 2;
	const mouseY = -(event.clientY - document.body.clientHeight / 2);
	const rangeSquared = Math.pow(Number(mouseEffectRange.value), 2);
	const amplitude = Number(mouseEffectAmplitude.value) / 100;

	const particlesMesh = particles.value.mesh;
	particlesStates.value.forEach((state, i) => {
		// Calculate squared distance between particle and mouse position
		const dx = mouseX - state.position.x;
		const dy = mouseY - state.position.y;
		const distanceSquared = dx * dx + dy * dy;

		// Check if particle is within the mouse effect range
		if (distanceSquared < rangeSquared) {
			// Apply amplitude to move particle away from cursor
			const effectStrength = amplitude * (1 - distanceSquared / rangeSquared);
			state.position.x -= dx * effectStrength;
			state.position.y -= dy * effectStrength;
		}

		// Update dummy object and instance matrix
		dummy.position.set(state.position.x, state.position.y, state.position.z);
		dummy.updateMatrix();
		particlesMesh.setMatrixAt(i, dummy.matrix);
	});

	// Update InstanceMatrix only once
	particlesMesh.instanceMatrix.needsUpdate = true;
}

const handleCameraResize = () => {
	const { innerWidth, innerHeight } = window;

	particlesAmount.value = Math.ceil(
		((innerWidth * innerHeight) / (2560 * 1440)) * 1000
	);
	camera.value.camera.aspect = innerWidth / innerHeight;
	camera.value.camera.position.z = calculateCameraZ(50, innerHeight);
	camera.value.camera.updateProjectionMatrix();
};

function calculateCameraZ(fov = 50, height) {
	const vFOV = (fov * Math.PI) / 180; // Convert FOV to radians
	return height / (2 * Math.tan(vFOV / 2)); // Calculate Z distance for the camera
}

const dummy = new THREE.Object3D();

const initParticles = () => {
	particlesStates.value = Array.from({ length: particlesAmount.value }, () => ({
		position: {
			x:
				document.body.clientWidth * Math.random() -
				document.body.clientWidth / 2,
			y:
				document.body.clientHeight * Math.random() -
				document.body.clientHeight / 2,
			z: 0,
		},
		rotation: {
			x: 0,
			y: 0,
			z: 0,
		},
	}));

	particlesStates.value.forEach((state, i) => {
		dummy.position.set(state.position.x, state.position.y, state.position.z);
		dummy.updateMatrix();
		particles.value.mesh.setMatrixAt(i, dummy.matrix);
	});

	particles.value.mesh.instanceMatrix.needsUpdate = true;
};

const loadSVGShape = async (svgPath) => {
	const loader = new SVGLoader();
	const data = await loader.loadAsync(svgPath);

	const paths = data.paths;
	targetPositions.value = []; // Clear previous positions if any

	const boundingBox = new THREE.Box2();

	// let holesCounter = 0;
	// let shapesCounter = 0;

	paths.forEach((path, i, a) => {
		const shapes = SVGLoader.createShapes(path);
		shapes.forEach((shape, i, b) => {
			// Get the points for each shape
			const outerPoints = shape.getSpacedPoints(
				Math.floor(particlesAmount.value / 2 / a.length / b.length) - 1
			);

			// shapesCounter +=
			// 	Math.floor(particlesAmount.value / 2 / a.length / b.length) - 1;

			// Push points to target positions
			outerPoints.forEach((point) => {
				boundingBox.expandByPoint(point);
				targetPositions.value.push({
					x: point.x,
					y: -point.y,
					z: 0,
				});
			});

			shape.holes.forEach((hole, i, c) => {
				// holesCounter +=
				// 	Math.floor(
				// 		particlesAmount.value / 2 / a.length / b.length / c.length
				// 	) - 1;
				const holePoints = hole.getSpacedPoints(
					Math.floor(
						particlesAmount.value / 2 / a.length / b.length / c.length
					) - 1
				);
				targetPositions.value.push(
					...holePoints.map((pt) => ({ x: pt.x, y: -pt.y, z: 0 }))
				);
			});
		});
	});

	// console.log("HOLES: " + holesCounter);
	// console.log("SHAPES: " + shapesCounter);
	// console.log("TOTAL POINTS: " + (holesCounter + shapesCounter));
	// console.log("TOTAL PARTICLES: " + particlesAmount.value);

	const width = boundingBox.max.x - boundingBox.min.x;
	const height = boundingBox.max.y - boundingBox.min.y;

	const desiredSize = Math.ceil(
		Math.min(window.innerHeight, window.innerWidth) / 2
	);
	const scaleFactor = desiredSize / Math.max(width, height);

	const centerOffsetX = -(boundingBox.min.x + boundingBox.max.x) / 2;
	const centerOffsetY = -(boundingBox.min.y + boundingBox.max.y) / 2;

	targetPositions.value = targetPositions.value.map(({ x, y, z }) => ({
		x: (x + centerOffsetX) * scaleFactor,
		y: (y - centerOffsetY) * scaleFactor,
		z,
	}));
};

const moveParticlesToTarget = () => {
	if (!isHovering && !lastOpened) return;

	const targetDummy = new THREE.Object3D();
	for (let i = 0; i < targetPositions.value.length; i++) {
		const { x, y, z } = targetPositions.value[i];
		gsap.to(particlesStates.value[i].position, {
			duration: 0.5,
			x,
			y,
			z,
			onUpdate: () => {
				targetDummy.position.set(
					particlesStates.value[i].position.x,
					particlesStates.value[i].position.y,
					particlesStates.value[i].position.z
				);
				targetDummy.updateMatrix();
				particles.value.mesh.setMatrixAt(i, targetDummy.matrix);
			},
			ease: "power1.out",
		});
	}
	// not needed: already in render loop
	// particles.value.mesh.instanceMatrix.needsUpdate = true;
};

const onHoverIcon = async (iconRef) => {
	isHovering = true;

	switch (iconRef) {
		case contactRef?.value.winbox?.id:
			await loadSVGShape("/mail.svg");
			break;
		case CVRef?.value.winbox?.id:
			await loadSVGShape("/cv.svg");
			break;
		case projectsRef?.value.winbox?.id:
			await loadSVGShape("/projects.svg");
			break;
		case terminalRef?.value.winbox?.id:
			await loadSVGShape("/terminal_dark.svg");
			break;
		case techsRef?.value.winbox?.id:
			await loadSVGShape("/techs_dark.svg");
			break;

		default:
			return;
	}

	moveParticlesToTarget();
	hoverTimeout = setTimeout(() => {
		moveParticlesToTarget();
		clearInterval(hoverInterval);
		hoverInterval = setInterval(() => moveParticlesToTarget(), 150);
	}, "500");
};

const onLeaveIcon = () => {
	isHovering = false;

	clearInterval(hoverInterval);
	clearTimeout(hoverTimeout);

	if (lastOpened) onHoverIcon(lastOpened);

	for (let i = 0; i < particlesAmount.value; i++) {
		gsap.killTweensOf(particlesStates.value[i].position);
	}

	const targetDummy = new THREE.Object3D();
	for (let i = 0; i < targetPositions.value.length; i++) {
		gsap.to(particlesStates.value[i].position, {
			duration: 0.5,
			x:
				document.body.clientWidth * Math.random() -
				document.body.clientWidth / 2,
			y:
				document.body.clientHeight * Math.random() -
				document.body.clientHeight / 2,
			z: 0,
			onUpdate: () => {
				targetDummy.position.set(
					particlesStates.value[i].position.x,
					particlesStates.value[i].position.y,
					particlesStates.value[i].position.z
				);
				targetDummy.updateMatrix();
				particles.value.mesh.setMatrixAt(i, targetDummy.matrix);
			},
			ease: "none",
		});
	}
	// not needed: already in render loop
	// particles.value.mesh.instanceMatrix.needsUpdate = true;
};

onMounted(() => {
	handleCameraResize();
	initParticles();

	window.addEventListener("resize", handleCameraResize);

	renderer?.value?.onBeforeRender(() => {
		document.onmousemove = handleMouseMove;

		particlesStates.value.forEach((state, i, array) => {
			if (state.position.x >= document.body.clientWidth / 2) {
				state.position.x = -document.body.clientWidth / 2;
			} else {
				state.position.x += (1 / array.length) * i;
			}

			if (state.position.y >= document.body.clientHeight / 2) {
				state.position.y = -document.body.clientHeight / 2;
			} else {
				state.position.y += (1 / array.length) * i;
			}

			state.rotation.x += 0.01;
			state.rotation.y += 0.01;
			state.rotation.z += 0.01;

			dummy.position.set(state.position.x, state.position.y, state.position.z);
			dummy.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z);
			dummy.updateMatrix();
			particles.value.mesh.setMatrixAt(i, dummy.matrix);
		});

		particles.value.mesh.instanceMatrix.needsUpdate = true;
	});
});

onUnmounted(() => {
	window.removeEventListener("resize", handleCameraResize);
});

watch(particlesAmount, () => {
	meshKey.value++;
	initParticles();
});

// VUE-COMMAND STUFF

const history = ref(newDefaultHistory());
const commands = {
	bio: () => createStdout(textFormatter(getBioHTML(), true)),
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
			textFormatter("<pre>" + techsFormatter(getTechs()) + "</pre>", true)
		),
	timeline: () => createStdout(timelineFormatter(getTimeline())),
	socials: () => createStdout(textFormatter(socialsHTML, true)),
};

// WINBOX STUFF
// WinBox only displays what the window store (lib/windows.js) says.

const globalOptions = {
	autosize: "true",
	class: "modern",
	hidden: true,
	width: "60%",
	height: "60%",
};

function appWindowOptions(key, extra = {}) {
	return {
		onclose() {
			closeWindow(key);
			return true; // keep the WinBox, it's only hidden
		},
		onfocus() {
			focusWindow(key);
		},
		onminimize() {
			// Minimised windows live in the taskbar, not WinBox's own dock
			this.minimize(false);
			minimizeWindow(key);
		},
		...globalOptions,
		...extra,
	};
}

const contactRef = ref();
const contactOptions = appWindowOptions("contact", {
	title: $t("App.contactForm"),
});

const CVRef = ref();
const CVOptions = appWindowOptions("cv", { title: "Curriculum Vitae" });

const projectsRef = ref();
const projectsOptions = appWindowOptions("projects", {
	title: $t("App.myProjects"),
});

const terminalRef = ref();
const terminalOptions = appWindowOptions("terminal", {
	title: "bash: durandarthur@MONOLITH",
});

const techsRef = ref();
const techsOptions = appWindowOptions("techs", {
	title: "Technologies",
	maxwidth: "1400px",
});

const creditsRef = ref();
const creditsOptions = {
	title: $t("App.about"),
	modal: true,
	onclose: function (force) {
		creditsRef.value.winbox.hide(true);
		return true;
	},
	...globalOptions,
};

// WinBox titles are set once, so follow language changes by hand
watch(lang, () => {
	contactRef.value?.winbox?.setTitle($t("App.contactForm"));
	projectsRef.value?.winbox?.setTitle($t("App.myProjects"));
	creditsRef.value?.winbox?.setTitle($t("App.about"));
});

// DESKTOP ICONS

const desktopIcons = [
	{ key: "contact", icon: "/icons/contact.svg", win: contactRef },
	{ key: "cv", icon: "/icons/cv.svg", win: CVRef },
	{ key: "projects", icon: "/icons/projects.svg", win: projectsRef },
	{ key: "terminal", icon: "/icons/terminal.svg", win: terminalRef },
	{ key: "techs", icon: "/icons/techs.svg", win: techsRef },
];
// Translated desktop label
const iconLabel = (key) => $t(`App.apps.${key}.label`);
const iconByKey = (key) => desktopIcons.find((icon) => icon.key === key);

const hoveredIcon = ref(null);
const hoveredInfo = computed(() => iconByKey(hoveredIcon.value));

function onIconEnter(icon) {
	hoveredIcon.value = icon.key;
	onHoverIcon(icon.win.value.winbox.id);
}
function onIconLeave(icon) {
	if (hoveredIcon.value !== icon.key) return;
	hoveredIcon.value = null;
	onLeaveIcon();
}
// Keyboard focus behaves like hover; mouse-click focus doesn't
function onIconFocus(event, icon) {
	if (event.target.matches(":focus-visible")) onIconEnter(icon);
}

function sizeWindow(winbox) {
	if (isMobile()) return;
	winbox.resize(
		Math.max(0.6 * window.innerWidth, 500),
		Math.max(0.6 * window.innerHeight, 200)
	);
}

// Show / hide / focus the WinBoxes to match the store
watchEffect(() => {
	desktopIcons.forEach((icon) => {
		const winbox = icon.win.value?.winbox;
		if (!winbox) return;
		const visible = isVisible(icon.key);
		if (visible && winbox.hidden) {
			sizeWindow(winbox);
			winbox.show();
		} else if (!visible && !winbox.hidden) {
			winbox.hide();
		}
	});
	const focused = iconByKey(focusedKey.value);
	focused?.win.value?.winbox?.focus();
});

// The particles form the focused window's glyph (hovering an icon takes priority)
watch(focusedKey, (key) => {
	lastOpened = key ? iconByKey(key).win.value.winbox.id : null;
	if (hoveredIcon.value) return;
	if (lastOpened) onHoverIcon(lastOpened);
	else onLeaveIcon();
});

// OTHER STUFF

const showNotice = ref(true);

function openFromNotice(key) {
	if (!isVisible(key)) toggleFromDesktop(key);
	else focusWindow(key);
}

function toggleAbout() {
	const winbox = creditsRef.value?.winbox;
	if (!winbox) return;
	winbox.hide(!winbox.hidden);
	if (!winbox.hidden && !isMobile()) {
		sizeWindow(winbox);
		winbox.move("center", "center");
		winbox.resize = false;
		winbox.move = false;
	}
}
</script>

<template>
	<body>
		<Renderer
			ref="renderer"
			:resize="'window'"
			pointer
			alpha
			class="testg"
			aria-hidden="true"
		>
			<Camera ref="camera" :position="{ z: 1500 }" :aspect="16 / 9" />
			<Scene>
				<PointLight ref="light" color="#00ffff" />
				<Box
					ref="box"
					:rotation="{ y: Math.PI / 4, z: Math.PI / 4 }"
					:position="{ z: 100000 }"
					widthSegments="5"
					heightSegments="5"
					depthSegments="5"
					:size="100"
				>
					<BasicMaterial :props="{ wireframe: true }" color="#04D9FF" />
				</Box>
				<InstancedMesh
					:key="meshKey"
					ref="particles"
					:count="Number(particlesAmount)"
				>
					<TetrahedronGeometry />
					<BasicMaterial :props="{ wireframe: true }" color="#04D9FF" />
				</InstancedMesh>
			</Scene>
		</Renderer>
		<!-- Idle: prompt, (space for the particle name), tagline, hint -->
		<Transition name="fade">
			<section
				v-if="!hoveredIcon && !anyVisible"
				class="desktop-idle"
				aria-labelledby="desktop-title"
			>
				<p class="desktop-idle__prompt">
					<span class="text-accent">arthur@portfolio</span>:~$ whoami<span
						class="desktop-idle__cursor"
						aria-hidden="true"
					></span>
				</p>
				<h1 id="desktop-title" class="sr-only">Arthur Durand</h1>
				<div class="desktop-idle__name-space" aria-hidden="true"></div>
				<p class="desktop-idle__tagline">{{ $t("App.desktop.tagline") }}</p>
				<p class="desktop-idle__hint">
					<span class="chip chip--key">{{ $t("App.desktop.hintClick") }}</span>
					<span>{{ $t("App.desktop.hintOpen") }}</span>
					<span class="text-ink-faint" aria-hidden="true">·</span>
					<span>{{ $t("App.desktop.hintType") }}</span>
					<span class="chip chip--cmd">help</span>
					<span>{{ $t("App.desktop.hintTerminal") }}</span>
				</p>
			</section>
		</Transition>

		<!-- Hover: caption around the particle glyph -->
		<Transition name="fade">
			<div v-if="hoveredInfo && !anyVisible" class="desktop-hover">
				<p class="desktop-hover__name" aria-hidden="true">
					A R T H U R &#160; D U R A N D
				</p>
				<div class="desktop-hover__caption">
					<p class="desktop-hover__title">{{ iconLabel(hoveredInfo.key) }}</p>
					<p class="desktop-hover__desc">
						{{ $t(`App.desktop.descriptions.${hoveredInfo.key}`) }}
					</p>
					<p class="desktop-hover__hint">{{ $t("App.desktop.hoverHint") }}</p>
				</div>
			</div>
		</Transition>

		<main>
			<nav aria-label="Desktop" class="desktop-icons">
				<DesktopIcon
					v-for="icon in desktopIcons"
					:key="icon.key"
					:icon="icon.icon"
					:label="iconLabel(icon.key)"
					:active="isOpenHere(icon.key)"
					:dimmed="!!hoveredIcon && hoveredIcon !== icon.key"
					@open="toggleFromDesktop(icon.key)"
					@mouseenter="onIconEnter(icon)"
					@mouseleave="onIconLeave(icon)"
					@focus="onIconFocus($event, icon)"
					@blur="onIconLeave(icon)"
				/>
			</nav>

			<VueWinBox ref="contactRef" :options="contactOptions" @onmove="onMove">
				<ContactForm />
			</VueWinBox>

			<VueWinBox ref="CVRef" :options="CVOptions" @onmove="onMove">
				<iframe :src="getCvUrl()" frameborder="0"></iframe>
			</VueWinBox>

			<VueWinBox ref="projectsRef" :options="projectsOptions" @onmove="onMove">
				<div class="grid gap-4 grid-cols-1 p-4">
					<ProjectCard
						:title="$t('App.ffReworkTitle')"
						imageLink="fanfictionrework-thumbnail.png"
						link="https://demo.fanfiction-rework.com/"
					>
						{{ $t("App.ffReworkDetail") }}
					</ProjectCard>
				</div>
				<div class="grid gap-4 grid-cols-1 p-4">
					<ProjectCard
						:title="$t('App.stLoungeTitle')"
						imageLink="stlounge-thumbnail.png"
						link="https://github.com/durandarthur/stlounge"
						:linkText="$t('ProjectCard.repoLink')"
					>
						{{ $t("App.stLoungeDetail") }}
					</ProjectCard>
				</div>
			</VueWinBox>

			<VueWinBox ref="terminalRef" :options="terminalOptions" @onmove="onMove">
				<vue-command
					:commands="commands"
					:history="history"
					class="w-full h-full"
					font="JetBrains Mono"
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
				<TechTreeNode :node="getTechs()" />
			</VueWinBox>

			<VueWinBox ref="creditsRef" :options="creditsOptions">
				<div class="w-full h-full bg-[#111316] text-white p-8">
					<h2 class="text-xl mb-4">{{ $t("App.moreInfo.credits") }}:</h2>
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
					<h2 class="text-xl mb-4">
						{{ $t("App.moreInfo.legalNoticeTitle") }}:
					</h2>
					<p
						class="2xl:w-1/2 mb-4"
						v-html="$t('App.moreInfo.legalNoticeDetail')"
					></p>
					<h2 class="text-xl mb-4">{{ $t("App.moreInfo.otherContacts") }}:</h2>
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
					<div class="mt-12">
						<input
							type="range"
							name="particlesAmount"
							id="particlesAmount"
							min="10"
							max="10000"
							v-model="particlesAmount"
						/>
						<label
							class="text-white"
							for="particlesAmount"
							v-text="$t('App.moreInfo.particlesAmount')"
						></label>
					</div>
					<div>
						<input
							type="range"
							name="mouseEffectRange"
							id="mouseEffectRange"
							min="10"
							max="500"
							:value="mouseEffectRange"
							@input="(event) => (mouseEffectRange = event.target.value)"
						/>
						<label
							class="text-white"
							for="mouseEffectRange"
							v-text="$t('App.moreInfo.mouseRadius')"
						></label>
					</div>
					<div>
						<input
							type="range"
							name="mouseEffectAmplitude"
							id="mouseEffectAmplitude"
							min="0"
							max="10"
							:value="mouseEffectAmplitude"
							@input="(event) => (mouseEffectAmplitude = event.target.value)"
						/>
						<label
							class="text-white"
							for="mouseEffectAmplitude"
							v-text="$t('App.moreInfo.effectStrength')"
						></label>
					</div>
					<p class="mt-12">
						{{ $t("App.moreInfo.pleaseReportBugs") }}
					</p>
					<p class="flex m-4 w-full text-[#04d9ff] version text-right">
						<a
							class="flex items-start ml-auto underline underline-offset-2"
							href="https://github.com/durandarthur/portfolio"
							target="_blank"
							rel="noopener noreferrer"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="size-6 h-5 mr-1"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
								/>
							</svg>
							<p>PortfolioOS v.2.4</p>
						</a>
					</p>
				</div>
			</VueWinBox>
		</main>

		<WelcomeNotice
			v-if="showNotice"
			@open-cv="openFromNotice('cv')"
			@dismiss="showNotice = false"
		/>

		<Taskbar :apps="desktopIcons" @about="toggleAbout" />
	</body>
</template>

<style scoped>
/* ── Desktop ───────────────────────────────────────── */
.desktop-icons {
	position: absolute;
	left: 28px;
	top: 28px;
	z-index: 1;
	display: flex;
	flex-direction: column;
	flex-wrap: wrap;
	align-content: flex-start;
	gap: 22px;
	max-height: calc(100vh - 28px - 104px);
}

.desktop-idle {
	position: absolute;
	inset: 0 0 104px 0;
	/* keeps centred text clear of the icon column (28 + 88 + 16) */
	padding: 0 132px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 22px;
	text-align: center;
	pointer-events: none;
}
.desktop-idle__prompt {
	font-size: 15px;
	color: var(--text-muted);
}
.desktop-idle__cursor {
	display: inline-block;
	width: 9px;
	height: 17px;
	margin-left: 6px;
	vertical-align: -3px;
	background: var(--cyan);
}
.desktop-idle__name-space {
	width: min(1080px, 100%);
	height: 130px;
}
.desktop-idle__tagline {
	font-size: 20px;
	line-height: 1.5;
	color: var(--text);
}
.desktop-idle__hint {
	margin-top: 8px;
	font-size: 12px;
	color: var(--text-muted);
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	gap: 10px;
}
/* Exception to the no-chip rule, kept as in the mockup */
.chip {
	padding: 3px 8px;
	border-radius: 6px;
}
.chip--key {
	border: 1px solid rgba(122, 139, 163, 0.45);
	color: var(--text);
}
.chip--cmd {
	background: rgba(34, 211, 238, 0.1);
	color: var(--cyan);
}

/* Placed around the particle glyph, which is centred on the viewport and
   min(vw, vh) / 2 across (see loadSVGShape). */
.desktop-hover {
	--glyph-half: min(25vw, 25vh);
	position: absolute;
	inset: 0;
	padding: 0 132px;
	text-align: center;
	pointer-events: none;
}
.desktop-hover__name {
	position: absolute;
	left: 0;
	right: 0;
	bottom: calc(50vh + var(--glyph-half) + 26px);
	font-size: 13px;
	letter-spacing: 0.3em;
	color: var(--text-faint);
}
.desktop-hover__caption {
	position: absolute;
	left: 132px;
	right: 132px;
	top: min(calc(50vh + var(--glyph-half) + 26px), calc(100vh - 104px - 124px));
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
}
.desktop-hover__title {
	font-size: 34px;
	font-weight: 800;
	letter-spacing: -0.01em;
	color: var(--cyan);
}
.desktop-hover__desc {
	font-size: 16px;
	color: var(--text);
}
.desktop-hover__hint {
	margin-top: 4px;
	font-size: 12px;
	color: var(--text-muted);
}

/* Phones: icons become a row at the top */
@media (max-width: 767px) {
	.desktop-icons {
		left: 12px;
		right: 12px;
		top: 12px;
		flex-direction: row;
		justify-content: center;
		gap: 4px;
		max-height: none;
	}
	.desktop-idle {
		inset: 0 0 88px 0;
		padding: 100px 16px 0;
		gap: 16px;
	}
	.desktop-idle__name-space {
		height: 80px;
	}
	.desktop-idle__tagline {
		font-size: 16px;
	}
	.desktop-hover {
		padding: 0 16px;
	}
	.desktop-hover__caption {
		left: 16px;
		right: 16px;
	}
	.desktop-hover__title {
		font-size: 26px;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
	.fade-enter-active,
	.fade-leave-active {
		transition: none;
	}
}

ul,
.time,
.version {
	font-family: var(--font-mono);
}

input[type="range"] {
	accent-color: #04d9ff;
}
</style>
