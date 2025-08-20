<script setup>
import { gsap } from "gsap";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { onMounted, onUnmounted, ref, watch } from "vue";
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
import TechTreeNode from "./components/TechTreeNode.vue";
import { bioHTML, socialsHTML, techs, timeline } from "./data";
import { techsFormatter, timelineFormatter } from "./lib/formatters";

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
	autosize: "true",
	class: "modern",
	hidden: true,
	width: "60%",
	height: "60%",
};

const contactRef = ref();
const contactOptions = {
	title: "Formulaire de contact",
	onclose: function (force) {
		contactRef.value.winbox.hide(true);
		if (lastOpened === this.id) {
			lastOpened = null;
			onLeaveIcon();
		}

		return true;
	},
	...globalOptions,
};

const CVRef = ref();
const CVOptions = {
	title: "Curriculum Vitae",
	onclose: function (force) {
		CVRef.value.winbox.hide(true);
		if (lastOpened === this.id) {
			lastOpened = null;
			onLeaveIcon();
		}

		return true;
	},
	...globalOptions,
};

const projectsRef = ref();
const projectsOptions = {
	title: "My Projects",
	onclose: function (force) {
		projectsRef.value.winbox.hide(true);
		if (lastOpened === this.id) {
			lastOpened = null;
			onLeaveIcon();
		}

		return true;
	},
	...globalOptions,
};

const terminalRef = ref();
const terminalOptions = {
	title: "bash: durandarthur@MONOLITH",
	onclose: function (force) {
		terminalRef.value.winbox.hide(true);
		if (lastOpened === this.id) {
			lastOpened = null;
			onLeaveIcon();
		}
		return true;
	},
	...globalOptions,
};

const techsRef = ref();
const techsOptions = {
	title: "Technologies",
	onclose: function (force) {
		techsRef.value.winbox.hide(true);
		if (lastOpened === this.id) {
			lastOpened = null;
			onLeaveIcon();
		}
		// onLeaveIcon(techsRef?.value.winbox?.id);
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
	if (!isMobile()) {
		if (ref?.winbox?.id === creditsRef?.value?.winbox?.id) {
			ref?.winbox?.hide(!ref?.winbox?.hidden);
			if (!ref?.winbox?.hidden) {
				ref?.winbox?.resize(
					Math.max(0.6 * window.innerWidth, 500),
					Math.max(0.6 * window.innerHeight, 200)
				);

				ref?.winbox?.move("center", "center");
				creditsRef.value.winbox.resize = false;
				creditsRef.value.winbox.move = false;
			}
			return;
		}
		ref?.winbox?.resize(
			Math.max(0.6 * window.innerWidth, 500),
			Math.max(0.6 * window.innerHeight, 200)
		);
	}

	lastOpened = ref.winbox.id;
	onHoverIcon(ref.winbox.id);

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
</script>

<template>
	<body>
		<Renderer ref="renderer" :resize="'window'" pointer class="testg">
			<Camera ref="camera" :position="{ z: 1500 }" :aspect="16 / 9" />
			<Scene background="black">
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
		<main class="flex">
			<div class="flex flex-col content-start flex-wrap w-screen h-[85vh]">
				<DesktopIcon
					@iconClicked="onIconClicked(contactRef)"
					@mouseenter="onHoverIcon(contactRef.winbox.id)"
					@mouseleave="onLeaveIcon"
				>
					<template #text> Contact </template>
					<template #image>
						<img
							src="/mail_dark.svg"
							width="200"
							alt=""
							class="hover:p-4 hover:rounded-3xl"
						/>
					</template>
				</DesktopIcon>

				<DesktopIcon
					@iconClicked="onIconClicked(CVRef)"
					@mouseenter="onHoverIcon(CVRef.winbox.id)"
					@mouseleave="onLeaveIcon"
				>
					<template #text> CV </template>
					<template #image>
						<img
							src="/cv_dark.svg"
							width="200"
							alt=""
							class="hover:p-4 hover:rounded-3xl"
						/>
					</template>
				</DesktopIcon>

				<DesktopIcon
					@iconClicked="onIconClicked(projectsRef)"
					@mouseenter="onHoverIcon(projectsRef.winbox.id)"
					@mouseleave="onLeaveIcon"
				>
					<template #text> Projects </template>
					<template #image>
						<img
							src="/projects.svg"
							width="200"
							alt=""
							class="hover:p-4 hover:rounded-3xl"
						/>
					</template>
				</DesktopIcon>

				<DesktopIcon
					@iconClicked="onIconClicked(terminalRef)"
					@mouseenter="onHoverIcon(terminalRef.winbox.id)"
					@mouseleave="onLeaveIcon"
				>
					<template #text> Terminal </template>
					<template #image>
						<img
							src="/terminal_dark.svg"
							width="200"
							alt=""
							class="hover:p-4 hover:rounded-3xl"
						/>
					</template>
				</DesktopIcon>

				<DesktopIcon
					@iconClicked="onIconClicked(techsRef)"
					@mouseenter="onHoverIcon(techsRef.winbox.id)"
					@mouseleave="onLeaveIcon"
				>
					<template #text> Techs </template>
					<template #image>
						<img
							src="/techs.svg"
							width="200"
							alt=""
							class="hover:p-4 hover:rounded-3xl"
						/>
					</template>
				</DesktopIcon>
			</div>

			<VueWinBox ref="contactRef" :options="contactOptions" @onmove="onMove">
				<ContactForm />
			</VueWinBox>

			<VueWinBox ref="CVRef" :options="CVOptions" @onmove="onMove">
				<iframe src="/CV_Arthur_Durand_2025_(portfolio).pdf" frameborder="0"></iframe>
			</VueWinBox>

			<VueWinBox ref="projectsRef" :options="projectsOptions" @onmove="onMove">
				<div class="grid gap-4 grid-cols-1 p-4">
					<ProjectCard
						title="Fanfiction.net rework"
						link="https://demo.fanfiction-rework.com/"
					>
						A rework of the well known collaborative writing website. This
						project features fullstack web development with Adonis JS and React
						with Mantine UI, file uploading, word document to HTML conversion,
						WebSockets usage, SSO, and more. Deployed on a Hetzner VPS using
						Docker, nginx, SSL and a Cloudflare domain.
					</ProjectCard>
				</div>
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
					<div class="mt-12">
						<input
							type="range"
							name="particlesAmount"
							id="particlesAmount"
							min="10"
							max="10000"
							v-model="particlesAmount"
						/>
						<label class="text-white" for="particlesAmount"
							>Nombre de particules (instable)</label
						>
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
						<label class="text-white" for="particlesAmount"
							>Rayon de l'effet curseur</label
						>
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
						<label class="text-white" for="particlesAmount"
							>Amplitude de l'effet curseur</label
						>
					</div>
					<p class="mt-12">
						Veuillez me signaler tout bug informatique rencontré sur ce site.
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
							<p>PortfolioOS v.2.2</p>
						</a>
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
					v-if="!projectsRef?.winbox?.hidden"
					src="/projects.png"
					alt=""
					@click="onBarIconClicked(projectsRef)"
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

input[type="range"] {
	accent-color: #04d9ff;
}
</style>
