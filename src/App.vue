<script setup>
import { computed, ref, watch } from "vue";
import VueCommand, {
	createQuery,
	createStdout,
	listFormatter,
	newDefaultHistory,
	textFormatter,
} from "vue-command";
import "vue-command/dist/vue-command.css";
import ContactForm from "./components/ContactForm.vue";
import DesktopIcon from "./components/DesktopIcon.vue";
import ParticleField from "./components/ParticleField.vue";
import ProjectsWindow from "./components/ProjectsWindow.vue";
import Taskbar from "./components/Taskbar.vue";
import TechsWindow from "./components/TechsWindow.vue";
import WelcomeNotice from "./components/WelcomeNotice.vue";
import WindowFrame from "./components/WindowFrame.vue";
import { getBioHTML, getTimeline, socialsHTML } from "./data";
import { projects } from "./projects";
import { $t, getCvUrl } from "./i18n";
import { techsTreeFormatter, timelineFormatter } from "./lib/formatters";
import { particleSettings } from "./lib/particleSettings";
import {
	anyVisible,
	closeWindow,
	focusWindow,
	focusedKey,
	isOpenHere,
	isVisible,
	toggleFromDesktop,
	windows,
} from "./lib/windows";

// PARTICLES

const field = ref(null);

// VUE-COMMAND STUFF

const history = ref(newDefaultHistory());

// Closing the terminal clears it (minimising keeps it) by remounting
// vue-command with a fresh history. Replacing the history alone isn't
// enough: vue-command keys entries by position and every prompt is the same
// component, so it would reuse the old, already-submitted (disabled) prompt.
const terminalKey = ref(0);
watch(
	() => windows.terminal?.open,
	(open, wasOpen) => {
		if (!wasOpen || open) return;
		history.value = newDefaultHistory();
		terminalKey.value++;
	}
);
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
	techs: () => createStdout(textFormatter(techsTreeFormatter(), true)),
	timeline: () => createStdout(timelineFormatter(getTimeline())),
	socials: () => createStdout(textFormatter(socialsHTML, true)),
	// Closes the window once vue-command has finished with this command;
	// closing clears the history (see the watch below)
	exit: () => {
		setTimeout(() => closeWindow("terminal"));
		return createQuery();
	},
};

// DESKTOP ICONS

const desktopIcons = [
	{ key: "contact", icon: "/icons/contact.svg" },
	{ key: "cv", icon: "/icons/cv.svg" },
	{ key: "projects", icon: "/icons/projects.svg" },
	{ key: "terminal", icon: "/icons/terminal.svg" },
	{ key: "techs", icon: "/icons/techs.svg" },
];
// Translated desktop label
const iconLabel = (key) => $t(`App.apps.${key}.label`);
const iconTitle = (key) => $t(`App.apps.${key}.title`);
const iconByKey = (key) => desktopIcons.find((icon) => icon.key === key);

const hoveredIcon = ref(null);
const hoveredInfo = computed(() => iconByKey(hoveredIcon.value));

function onIconEnter(icon) {
	hoveredIcon.value = icon.key;
	field.value?.hover(icon.key);
}
function onIconLeave(icon) {
	if (hoveredIcon.value !== icon.key) return;
	hoveredIcon.value = null;
	field.value?.leave();
}
// Keyboard focus behaves like hover; mouse-click focus doesn't
function onIconFocus(event, icon) {
	if (event.target.matches(":focus-visible")) onIconEnter(icon);
}

// The particles form the focused window's glyph (a hovered icon takes priority)
watch(focusedKey, (key) => field.value?.setActive(iconByKey(key) ? key : null));

// OTHER STUFF

const showNotice = ref(true);

function openFromNotice(key) {
	if (!isVisible(key)) toggleFromDesktop(key);
	else focusWindow(key);
}

function toggleAbout() {
	toggleFromDesktop("about");
}
</script>

<template>
	<body>
		<ParticleField ref="field" :defocused="anyVisible" />
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
				<!-- The particles spell the name here (see ParticleField) -->
				<div
					class="desktop-idle__name-space"
					data-particle-anchor="name"
					aria-hidden="true"
				></div>
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

			<WindowFrame
				app-key="contact"
				:title="iconTitle('contact')"
				icon="/icons/contact.svg"
			>
				<ContactForm />
			</WindowFrame>

			<WindowFrame
				app-key="cv"
				:title="iconTitle('cv')"
				icon="/icons/cv.svg"
				:height="0.85"
			>
				<iframe
					:src="getCvUrl()"
					title="Curriculum Vitae"
					class="block w-full h-full border-0"
				></iframe>
			</WindowFrame>

			<WindowFrame
				app-key="projects"
				:title="iconTitle('projects')"
				icon="/icons/projects.svg"
				:width="960"
				:height="680"
				:subtitle="$t('Projects.count').replace('{n}', projects.length)"
			>
				<ProjectsWindow />
			</WindowFrame>

			<WindowFrame
				app-key="terminal"
				:title="iconTitle('terminal')"
				icon="/icons/terminal.svg"
				autofocus=".vue-command__query__input:not([disabled])"
			>
				<vue-command
					:key="terminalKey"
					:commands="commands"
					:history="history"
					class="terminal w-full h-full"
				>
					<template #bar>
						<div></div>
					</template>
					<template #prompt>
						<span class="term-user">durandarthur@MONOLITH</span
						><span class="term-path">:~/code/personal/portfolio$</span>&nbsp;
					</template>
				</vue-command>
			</WindowFrame>

			<TechsWindow />

			<WindowFrame app-key="about" :title="$t('App.about')">
				<div class="w-full p-8 text-ink">
					<h2 class="text-xl mb-4">{{ $t("App.moreInfo.credits") }}:</h2>
					<ul class="list-disc list-inside marker:text-[#22D3EE] mb-4">
						<li>
							<a
								href="https://github.com/ndabAP/vue-command"
								class="underline underline-offset-2 hover:text-[#22D3EE]"
								>Vue-Command</a
							>
						</li>
						<li>
							<a
								href="https://troisjs.github.io/"
								class="underline hover:text-[#22D3EE]"
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
								fill="#22D3EE"
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
								class="underline underline-offset-2 hover:text-[#22D3EE]"
								>durandarthur09@outlook.fr</a
							>
						</li>
						<li class="flex mb-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="#22D3EE"
								viewBox="0 0 24 24"
								strokeWidth="{1.5}"
								stroke="#22D3EE"
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
									<g fill="#22D3EE">
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
								class="underline underline-offset-2 hover:text-[#22D3EE]"
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
							v-model.number="particleSettings.amount"
						/>
						<label
							class="text-ink"
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
							v-model.number="particleSettings.mouseRange"
						/>
						<label
							class="text-ink"
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
							v-model.number="particleSettings.mouseAmplitude"
						/>
						<label
							class="text-ink"
							for="mouseEffectAmplitude"
							v-text="$t('App.moreInfo.effectStrength')"
						></label>
					</div>
					<p class="mt-12">
						{{ $t("App.moreInfo.pleaseReportBugs") }}
					</p>
					<p class="flex m-4 w-full text-[#22D3EE] version text-right">
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
							<p>PortfolioOS v.2.5</p>
						</a>
					</p>
				</div>
			</WindowFrame>
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
	animation: cursor-blink 1.1s steps(1) infinite;
}
@keyframes cursor-blink {
	50% {
		opacity: 0;
	}
}
@media (prefers-reduced-motion: reduce) {
	.desktop-idle__cursor {
		animation: none;
	}
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
	accent-color: var(--cyan);
}
</style>
