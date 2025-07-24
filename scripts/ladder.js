export function ladder(enter_height, exit_height) {
	const Token = event.data.token;
	const Heights = [20, 0];


	if (Token.elevation == Heights[0]) {
	 Token.elevation = Heights[1];
	  Token.update({ elevation: Token.elevation });
	} else {
	  Token.elevation = Heights[0];
	  Token.update({ elevation: Token.elevation });
	}
}
