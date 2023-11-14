const PING_HEARTBEAT_INTERVAL = 30;
const PONG_TIMEOUT = 10;

function mapById(list, options) {
	return new Map(
		list.map((object) => [
			options?.getId?.(object) ?? object._id,
			options?.getObject?.(object) ?? object
		])
	);
}

function getOtherRecipient(recipients) {
	return new Promise((resolve, reject) => {
		const other = recipients.find((recipient) => client.user?._id != recipient);
		if (other == undefined) {
			reject();
			return;
		}

		client.fetchUser(other).then(resolve).catch(reject);
		return;
	});
}

export { PING_HEARTBEAT_INTERVAL, PONG_TIMEOUT, mapById, getOtherRecipient };
