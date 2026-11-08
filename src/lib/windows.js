// Window manager state: which app windows are open, minimised, focused,
// and which workspace each one lives in.
import { computed, reactive, ref } from "vue";

export const WORKSPACE_COUNT = 3;
export const currentWorkspace = ref(0);

// key -> { open, minimized, workspace, z, openedAt }
export const windows = reactive({});
let topZ = 0;
let openCounter = 0;

const inCurrent = (w) => w?.open && w.workspace === currentWorkspace.value;

export const isOpenHere = (key) => !!inCurrent(windows[key]);
export const isVisible = (key) => isOpenHere(key) && !windows[key].minimized;

// Open windows of the current workspace, in the order they were opened
export const openList = computed(() =>
	Object.keys(windows)
		.filter((key) => inCurrent(windows[key]))
		.sort((a, b) => windows[a].openedAt - windows[b].openedAt)
);

// Topmost visible window of the current workspace
export const focusedKey = computed(() => {
	let best = null;
	for (const key of openList.value) {
		if (windows[key].minimized) continue;
		if (!best || windows[key].z > windows[best].z) best = key;
	}
	return best;
});

export const anyVisible = computed(() => focusedKey.value !== null);

export function focusWindow(key) {
	const w = windows[key];
	if (!w || w.z === topZ) return;
	w.z = ++topZ;
}

export function openWindow(key) {
	windows[key] = {
		open: true,
		minimized: false,
		workspace: currentWorkspace.value,
		z: ++topZ,
		openedAt: ++openCounter,
	};
}

export function closeWindow(key) {
	if (windows[key]) windows[key].open = false;
}

export function minimizeWindow(key) {
	if (windows[key]) windows[key].minimized = true;
}

export function restoreWindow(key) {
	if (!windows[key]) return;
	windows[key].minimized = false;
	focusWindow(key);
}

// Desktop icon: open it, bring it here from another workspace, restore it, or close it
export function toggleFromDesktop(key) {
	const w = windows[key];
	if (!w?.open) return openWindow(key);
	if (w.workspace !== currentWorkspace.value) {
		w.workspace = currentWorkspace.value;
		return restoreWindow(key);
	}
	if (w.minimized) return restoreWindow(key);
	closeWindow(key);
}

// Taskbar button: restore, minimise the focused window, or focus it
export function toggleFromTaskbar(key) {
	const w = windows[key];
	if (!w) return;
	if (w.minimized) return restoreWindow(key);
	if (focusedKey.value === key) return minimizeWindow(key);
	focusWindow(key);
}

export function switchWorkspace(index) {
	currentWorkspace.value = index;
}
