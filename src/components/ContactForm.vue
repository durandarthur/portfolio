<script setup lang="ts">
import { computed, reactive } from "vue";
import { $t } from "../i18n";

type Status = {
	submitted?: boolean;
	submitting?: boolean;
	info: { error: boolean; msg: string };
};

type MailData = {
	mailMessage: string;
	mailFrom: string;
};

const status = reactive<Status>({
	submitted: false,
	submitting: false,
	info: { error: false, msg: "" },
});

const handleServerResponse = async (
	ok: boolean,
	msg: Status["info"]["msg"]
) => {
	if (ok) {
		status.submitted = true;
		status.submitting = false;
		status.info = { error: false, msg: msg };
		mailData.mailMessage = "";
	} else {
		status.submitting = false;
		status.info = { error: true, msg: msg };
		mailData.mailMessage = "";
	}
};

const mailData = reactive<MailData>({
	mailFrom: "",
	mailMessage: "",
});
// Computed so it follows the current language
const textPlaceholder = computed(() => {
	if (status.info.error)
		return `${$t("ContactForm.errorMsg")}: "${status.info.msg}"`;
	if (status.submitted) return $t("ContactForm.msgSent");
	return $t("ContactForm.enterMsg");
});

async function sendMail() {
	status.submitting = true;
	try {
		const response = await fetch(import.meta.env.VITE_FORM_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(mailData),
		});
		if (response.ok) return handleServerResponse(true, $t("ContactForm.msgSent"));
		// The server's { error } message, else the HTTP status text
		const data = await response.json().catch(() => ({}));
		handleServerResponse(false, data.error ?? response.statusText);
	} catch (error) {
		// Network failure: no response at all (caught values are "unknown")
		handleServerResponse(false, error instanceof Error ? error.message : String(error));
	}
}
</script>

<template>
	<div class="h-full w-full contact">
		<label for="to" class="pl-4" v-text="$t('ContactForm.sender')"></label>
		<input
			class="pl-2"
			type="email"
			name="to"
			id="to"
			v-model="mailData.mailFrom"
			:placeholder="$t('ContactForm.mailPlaceholder')"
		/>

		<div class="flex w-full h-full justify-end pr-4">
			<div class="loader mr-2" v-if="status.submitting"></div>
			<button class="h-full w-10" @click="sendMail" v-else>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth="{1.5}"
					class="stroke-slate-300 hover:stroke-white"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
					/>
				</svg>
			</button>
		</div>

		<textarea
			class="message p-4 border-t border-[rgba(34,211,238,0.12)]"
			name="message"
			id="message"
			cols="30"
			rows="10"
			:placeholder="textPlaceholder"
			v-model="mailData.mailMessage"
		></textarea>
	</div>
</template>

<style lang="css" scoped>
.contact {
	display: grid;
	grid-template-columns: 3fr 24fr 2fr;
	grid-template-rows: 60px auto;
	overflow-x: hidden;
}
.contact > * {
	width: 100%;
	height: 100%;
}
.message {
	grid-column: span 3;
}
label {
	display: flex;
	align-items: center;
}
label,
input,
textarea {
	font-family: var(--font-mono);
	outline: none;
}
* {
	background-color: var(--window);
	color: var(--text-strong);
}

/* animation that plays on mail sent */
.loader {
	margin-block: auto;
	border-radius: 25%;
	border: 5px solid var(--cyan);
	aspect-ratio: 1;
	height: 50%;
	min-height: 24px;
	animation: spinner 1s cubic-bezier(0.5, 0.7, 0.7, 0.5) infinite;
}

@keyframes spinner {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>
