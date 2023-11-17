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
	const [session] = useContext(SessionContext);

	return recipients.find((user) => user != session()?.user_id);
}

export default {
	getAutumnURL,
	getDisplayName,
	getDisplayAvatar,
	getOtherRecipient,
};
