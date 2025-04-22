<script setup>
const props = defineProps({
	title: {
		required: true,
		type: String,
	},
	link: {
		required: false,
		type: String,
	},
});
</script>

<template>
	<div class="max-w-sm w-full lg:max-w-full lg:flex">
		<div
			class="border-l border-r border-white rounded-2xl h-48 h-auto w-48 flex-none bg-cover bg-center text-center overflow-hidden mr-1"
			style="background-image: url('fanfictionrework-thumbnail.png')"
			title="Project thumbnail"
		></div>
		<div
			class="border-b border-t border-[#04D9FF] rounded-2xl p-4 flex flex-col justify-between leading-normal ml-1"
		>
			<div class="mb-8">
				<div class="text-[#04D9FF] font-bold text-xl mb-2">{{ title }}</div>
				<p class="text-white text-base">
					<slot></slot>
				</p>
			</div>
			<div
				class="flex items-center w-full text-[#04D9FF] underline underline-offset-2"
				id="projectLink"
				v-if="link"
			>
				<a
					class="flex w-full items-start"
					:href="link"
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
					<p>Website link</p>
				</a>
			</div>
		</div>
	</div>
</template>
