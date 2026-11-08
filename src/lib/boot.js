// Hides the loading screen from index.html once the app is mounted, every
// resource on the page has loaded (icons included), the fonts are ready and
// it has shown for at least MIN_MS. MAX_MS stops a stuck request from
// keeping it up forever.
const MIN_MS = 500;
const MAX_MS = 10000;

export function finishBoot() {
	const el = document.getElementById("boot");
	if (!el) return;

	const pageLoaded =
		document.readyState === "complete"
			? Promise.resolve()
			: new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
	const fontsReady = document.fonts?.ready ?? Promise.resolve();
	const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const minShown = wait(Math.max(0, MIN_MS - performance.now()));

	Promise.race([Promise.all([pageLoaded, fontsReady, minShown]), wait(MAX_MS)]).then(() => {
		el.classList.add("boot--done");
		setTimeout(() => el.remove(), 300); // after the fade
	});
}
