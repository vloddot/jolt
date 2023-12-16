// @ts-expect-error No typings
import rgba from 'color-rgba';
import { useContext, type JSX } from 'solid-js';
import { SessionContext } from './context/Session';
import { UnreadsCollectionContext } from './context/collections/Unreads';
import { SettingsContext } from './context/Settings';

function getAutumnURL(
	file: { _id: string; tag: string },
	options?: Partial<{ max_side: string }>
): string {
	const { settings } = useContext(SettingsContext);
	return `${settings.instance.autumn}/${file.tag}/${file._id}?${new URLSearchParams(options)}`;
}

function getDefaultUserAvatar(user_id: string): string {
	const { settings } = useContext(SettingsContext);
	return `${settings.instance.delta}/users/${user_id}/default_avatar`;
}

function proxyURL(url: string): string {
	const { settings } = useContext(SettingsContext);
	return `${settings.instance.january}/proxy?url=${url}`;
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
): string {
	if (message?.webhook?.avatar != undefined) {
		return message.webhook.avatar;
	}

	if (message?.masquerade?.avatar != undefined) {
		return message.masquerade.avatar;
	}

	if (member?.avatar != undefined) {
		return `${getAutumnURL(member.avatar, { max_side: '256' })}`;
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

/**
 * Gets the unread object from the unreads collection
 * @param channel Channel object
 */
function unreadObject(channel: Channel): ChannelUnread | undefined {
	const unreads = useContext(UnreadsCollectionContext);
	return unreads.get(channel._id)?.[0];
}

function isUnread(channel: Channel, unread: ChannelUnread) {
	if (channel.channel_type == 'SavedMessages' || channel.channel_type == 'VoiceChannel') {
		return false;
	}

	return (unread.last_id?.localeCompare(channel.last_message_id ?? '0') ?? 0) == -1;
}

function inputSelected() {
	return ['TEXTAREA', 'INPUT'].includes(document.activeElement?.nodeName ?? '');
}

/**
 * Sorts the roles by rank (lowest number to highest number)
 * @param roleIds The array of role IDs
 * @param server The server containing these roles
 * @returns The roles sorted by rank
 */
function sortRoles(server: Server, roleIds: string[]) {
	const roles = server.roles;
	if (roles == undefined) {
		return [];
	}

	return roleIds
		.flatMap((id) => {
			const role = roles[id];
			if (role == undefined) {
				return [];
			}

			return [role];
		})
		.sort((a, b) => (a.rank ?? 1) - (b.rank ?? -1));
}

function getRoleColorStyle(color: string): JSX.CSSProperties {
	if (color.includes('gradient')) {
		return {
			background: `${color}`,
			'background-clip': 'text',
			'-webkit-background-clip': 'text',
			'-webkit-text-fill-color': 'transparent'
		};
	}

	return { color };
}

// thanks revite devs
function getContrastingColor(input: string, fallback?: string): string {
	const color = rgba(input);

	if (!color) return fallback ? getContrastingColor(fallback) : 'black';

	// https://awik.io/determine-color-bright-dark-using-javascript/
	// http://alienryderflex.com/hsp.html
	const [r, g, b] = color;
	const hsp = Math.sqrt(0.2126 * r ** 2 + 0.7152 * g ** 2 + 0.0722 * b ** 2);
	return hsp > 175 ? 'black' : 'white';
}

export default {
	getAutumnURL,
	proxyURL,
	getDisplayName,
	getDisplayAvatar,
	getDefaultUserAvatar,
	getOtherRecipient,
	hashMemberId,
	formatSize,
	unreadObject,
	isUnread,
	inputSelected,
	sortRoles,
	getRoleColorStyle,
	getContrastingColor
};
