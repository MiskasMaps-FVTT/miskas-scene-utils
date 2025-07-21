import { MODULE_NAME } from "./const.js";

export class RegionGroup {
	constructor(uuids = [], name) {
		if (!name) throw new Error("Name is required");

		if (!Array.isArray(uuids)) {
			uuids = [uuids];
		}

		this.ids = [];
		this.regions = {};
		this.scene = scene;

		let sceneId;
		for (const uuid of uuids) {
			const resolved = foundry.utils.parseUuid(uuid);
			sceneId = sceneId || resolved.primaryId;

			if (resolved.type != "Region") {
				throw new Error(`"${uuid}" is not a region uuid`);
			}
			if (resolved.primaryId != sceneId) {
				throw new Error(`All regions must be in the same scene`);
			}

			const region = fromUuidSync(uuid);
			this.ids.push(resolved.id);
			this.regions[resolved.id] = region;
		}

		this.ids = [...new Set(this.ids)];
	}

	insert({ uuid, region, index } = {}) {
		if (!uuid || !region) {
			throw new Error("UUID and/or reference to region is required");
		}
		uuid = uuid || region.uuid;
		const id = foundry.utils.parseUuid(uuid).id;

		if (this.ids.includes(id)) {
			throw new Error("Only one instance of each region is allowed");
		}

		region = region || fromUuidSync(uuid);

		if (region.parent != this.scene) {
			throw new Error("Region must be in the same scene as the group");
		}

		if (!index || index >= this.regions.length) {
			this.regions[id] = region;
			this.ids.push(id);
		} else {
			this.regions[id] = region;
			this.ids.splice(index, 0, id);
		}
	}

	remove({ uuid, region } = {}) {
		if (!uuid || !region) {
			throw new Error("UUID and/or reference to region is required");
		}
		uuid = uuid || region.uuid;
		region = region || fromUuidSync(uuid);

		if (region.parent != this.scene) {
			throw new Error("Region must be in the same scene as the group");
		}

		const id = foundry.utils.parseUuid(uuid).id;

		this.ids.findSplice((x) => x == id);
		this.regions.delete(id);
	}

	validate() {
		let invalid = 0;
		for (const [key, value] of this.regions) {
			if (value === undefined || !this.scene.regions.has(value)) {
				this.regions.delete(key);
				this.ids.findSplice((x) => x == key);
				invalid++;
				if (game.user.isGM) {
					ui.notifications.warn(
						`Removed ${invalid} invalid entries from teleporter group "${this.name}"`,
					);
				}
			}
		}
	}

	swap(index1, index2) {
		[this.regions[index1], this.regions[index2]] = [
			this.regions[index2],
			this.regions[index1],
		];
	}

	move(oldIndex, newIndex) {
		this.regions.splice(newIndex, 0, this.regions.splice(oldIndex, 1)[0]);
	}

	reorder(newOrder) {
		if (!Array.isArray(newOrder)) throw new Error("Input must be an array");
		newOrder = new Set(newOrder);
		const length = this.regions.length;
		if (newOrder.length !== length || Math.max(...newOrder) >= length) {
			throw new Error("Each index must be listed");
		}

		this.regions = (newOrder) => {
			const reorderedRegions = [];
			for (const index of newOrder) {
				reorderedRegions.push(this.regions[index]);
			}
			return reorderedRegions;
		};
	}
}

function generatePromptData(group, options) {
	const data = { content: "", buttons: [] };
	group = options.scene.getFlag(MODULE_NAME, "teleporters")[group];
	if (options.mode === "ladder") {
		if (group.ids.length <= 1) {
			throw new Error(
				"Group must have more than one region for the ladder mode to function",
			);
		}

		const curr = group.ids.indexOf(options.region.id);
		const prev = group.ids[curr - 1];
		const next = group.ids[curr + 1];
		let content = "Would you like to go ";

		if (prev) {
			data.buttons.push({
				action: "up",
				label: "Up",
				callback: (group) => {
					return prev;
				},
			});
			content += `up to ${group.regions[prev].name}`;
		}

		if (prev && next) content += " or ";

		if (next) {
			data.buttons.push({
				action: "down",
				label: "Down",
				callback: (group) => {
					return next;
				},
			});
			content += `down to ${group.regions[next].name}`;
		}

		content += "?";
		if (options.content === undefined) options.content = content;
	} else {
		options.content = options.content || "<p>Where would you like to go?</p>";
		const regionList = group.ids;

		data.buttons = [{
			action: "confirm",
			label: "Confirm",
			callback: (event, button, dialog) => button.form.elements.choice.value,
		}, {
			action: "close",
			label: "Close",
			default: true,
		}];

		for (const id of regionList) {
			const region = group.regions[id];
			data.content +=
				`<label><input type="radio" name="choice" value="${id}" checked> ${region.name}</label>`;
		}
	}

	return data;
}

function teleportTokens(currentRegion, targetRegion) {
	for (const token of currentRegion.tokens) {
		if (token.isOwner) {
			token.update({
				x: token.x - currentRegion.x + targetRegion.x,
				y: token.y - currentRegion.y + targetRegion.y,
			}, {
				teleport: true,
			});
		}
	}
}

async function promptTargetRegion(event, group, options) {
	if (!event.data.token.isOwner) {
		return Promise.resolve(false);
	}

	const data = generatePromptData(group, options);

	return await foundry.applications.api.DialogV2.wait({
		window: { title: options.title },
		content: options.content + data.content,
		buttons: data.buttons,
	});
}

export async function prompt(
	region,
	event,
	group,
	{
		title = "Teleporter",
		content,
		mode,
		tokenOffset,
	} = {},
) {
	const options = {
		title: mode == "elevator"
			? "Elevator"
			: mode == "ladder"
				? "Ladder"
				: title,
		content: content,
		mode: mode || "elevator",
		tokenOffset: tokenOffset,
	};
	if (!group) throw new Error("Group must be provided");
	options.region = region;
	options.scene = region.parent;
	if (!(group in options.scene.flags[MODULE_NAME].teleporters)) {
		throw new Error(`"${group}" is not a valid group in the scene`);
	}
	const targetId = await promptTargetRegion(event, group, options);
	try {
		const target = await fromUuid(options.scene.uuid + ".Region." + targetId);
		if (target) teleportTokens(region, target);
	} catch (err) {
		// Do nothing
	}
}

export async function insertRegion(uuid, group = "default", index) {
	const region = await fromUuid(uuid);
	const scene = region.parent;
	const regionGroup = scene.getFlag(MODULE_NAME, "teleporters")[group];

	if (!regionGroup) {
		scene.setFlag(
			MODULE_NAME,
			"teleporters",
			{ [group]: new RegionGroup(uuid, group, scene) },
		);
	} else {
		regionGroup.insert({ region: region, index: index });
	}
}

export function removeRegion(regionUuid, group = "default", index) {
	scene.getFlag(MODULE_NAME, "teleporters")[group].remove({
		uuid: regionUuid,
		index: index,
	});
}

export function clearRegions({ group, scene = canvas.scene }) {
	if (group) {
		scene.unsetFlag(MODULE_NAME, "teleporters")[group];
	} else {
		scene.unsetFlag(MODULE_NAME, "teleporters");
	}
}
