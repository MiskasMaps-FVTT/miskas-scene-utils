import { clearRegions, prompt, insertRegion, removeRegion, RegionGroup } from "./region_teleporter.js";

Hooks.on("init", () => {
	CONFIG.sceneutils = {
		RegionGroup,
	};

	CONFIG.sceneutils.teleporter = {
		prompt,
		insertRegion,
		removeRegion,
		clearRegions,
	}
});
