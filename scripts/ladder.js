/**
 * Modes:
 * ladder - change between heights if one matches
 * roof   - elevate to top
 * pit    - drop to bottom
 */
export function ladder(event, top, bottom, options = { mode: "ladder" }) {
	const Token = event.data.token;

	switch (options.mode) {
		case "ladder":
			if (Token.elevation == top) {
				Token.update({ elevation: bottom });
			} else if (Token.elevation == bottom) {
				Token.update({ elevation: top });
			}
			break;
		case "roof":
			if (Token.elevation < top) {
				Token.update({ elevation: top });
			}
			break;
		case "pit":
			if (Token.elevation > bottom) {
				Token.update({ elevation: bottom });
			}
			break;
	}
}
