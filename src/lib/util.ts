import { useContext } from 'solid-js';
import { SessionContext } from './context/session';

function getAutumnURL(
	file: { _id: string; tag: string },
	options?: Partial<{ max_side: string }>
): string {
	return `https://autumn.revolt.chat/${file.tag}/${file._id}?${new URLSearchParams(options)}`;
}

function getDefaultUserAvatar(user_id: string): string {
	return `https://api.revolt.chat/users/${user_id}/default_avatar`;
}

function getDisplayName(
	user: { display_name?: string; username: string },
	member?: Member,
	message?: Message
): string {
	return message?.masquerade?.name ?? member?.nickname ?? user?.display_name ?? user.username;
}

function getDisplayAvatar(
	user: { _id: string; avatar?: { _id: string; tag: string } },
	member?: Member,
	message?: Message
): string | undefined {
	if (message?.webhook?.avatar != undefined) {
		return message.webhook.avatar;
	}

	if (message?.masquerade?.avatar != undefined) {
		return message.masquerade.avatar;
	}

	if (member?.avatar != undefined) {
		return `${getAutumnURL(member.avatar, { max_side: '256' })}`;
	}

	if (user == undefined || message?.system != undefined) {
		return;
	}

	if (user.avatar == undefined) {
		return getDefaultUserAvatar(user._id);
	}

	return `${getAutumnURL(user.avatar, { max_side: '256' })}`;
}

function getOtherRecipient(recipients: string[]): string | undefined {
	const session = useContext(SessionContext)[0]();

	return recipients.find((user) => user != session?.user_id);
}

/**
 * Objects in JavaScript are not hashable in complex objects like `Map`s. See:
 * ```js
 * const map = new Map();
 * map.set({ a: 1, b: 2 }, 3);
 * console.log(map.get({ a: 1, b: 2 })) // Output: undefined
 * ```
 *
 * Because of this, this function is used to hash member IDs,
 * @param id member ID
 * @returns hashed member ID
 */
function hashMemberId(id: MemberCompositeKey) {
	return id.server + id.user;
}

/**
 * Formats a number of bytes into human-readable sizes.
 * @param bytes Amount of bytes
 * @param dp Number of decimal places to round to
 * @param si Whether to use SI units, aka powers of 1000. If false, uses binary (IEC), aka powers of 1024.
 * @returns Human-readable size
 */
function formatSize(bytes: number, dp = 2, si = true) {
	const k = si ? 1000 : 1024;
	const dm = dp < 0 ? 0 : dp;
	const sizes = si
		? ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
		: ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default {
	getAutumnURL,
	getDisplayName,
	getDisplayAvatar,
	getOtherRecipient,
	hashMemberId,
	formatSize
};
