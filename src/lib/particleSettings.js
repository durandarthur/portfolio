// Particle settings, shared by the particle field and the sliders in About
import { reactive } from "vue";

export const particleSettings = reactive({
	amount: 1000, // recomputed from the screen size on resize
	mouseRange: 250, // px
	mouseAmplitude: 1, // 0–10
});
