import { clearRegions, prompt, insertRegion, removeRegion, } from "./region_teleporter.js";

Hooks.on("init", () => {
	CONFIG.sceneutils = CONFIG.sceneutils || {};

	CONFIG.sceneutils.teleporter = {
		prompt,
		insertRegion,
		removeRegion,
		clearRegions,
	}
});
