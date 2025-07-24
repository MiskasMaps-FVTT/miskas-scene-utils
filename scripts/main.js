import { clearRegions, prompt, insertRegion, removeRegion, RegionGroup } from "./region_teleporter.js";
import { ladder } from "./ladder.js";

Hooks.on("init", () => {
	CONFIG.sceneutils = {
		RegionGroup,
		ladder,
	};

	CONFIG.sceneutils.teleporter = {
		prompt,
		insertRegion,
		removeRegion,
		clearRegions,
	}
});
