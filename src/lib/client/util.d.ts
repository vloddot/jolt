/**
 * Amount of seconds between each ping heartbeat.
 */
export declare const PING_HEARTBEAT_INTERVAL = 30;

/**
 * If the web socket doesn't respond to a ping with a pong in `PONG_TIMEOUT` seconds,
 * the `WebSocketClient` disconnects.
 */
export declare const PONG_TIMEOUT = 10;

export declare const mapById: {
	<Id, O extends { _id: Id }>(list: O[]): Map<Id, O>;
	<Id, OIn, OOut = OIn>(
		list: OIn[],
		options?: Partial<{
			getId(o: OIn): Id;
			getObject(o: OIn): OOut;
		}>
	): Map<Id, OOut>;
};

export declare const getOtherRecipient: (recipients: string[]) => Promise<User>;
