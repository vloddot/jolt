import api from './api';
import { batch, useContext } from 'solid-js';
import ClientContext from './context/client';
import { createStore } from 'solid-js/store';
import { SessionContext } from './context/session';

export interface MessageCollection {
	messages: Record<Message['_id'], Message | undefined>;
	users: Record<User['_id'], User>;
	members: Record<Member['_id']['user'], Member>;
	typing: string[];
}

const collections: Record<string, MessageCollection> = {};

export async function getMessageCollection(
	channel_id: string,
	info: { refetching: boolean }
): Promise<MessageCollection> {
	let collection = collections[channel_id];
	if (!collection || info.refetching) {
		const response = await api.queryMessages([channel_id, { sort: 'Latest', include_users: true }]);
		const client = useContext(ClientContext);
		const [session] = useContext(SessionContext);

		const [messages, setMessages] = createStore<MessageCollection['messages']>(
			Object.fromEntries(response.messages.reverse().map((message) => [message._id, message]))
		);
		const [typing, setTyping] = createStore<string[]>([]);

		client.on('Message', (message) => {
			if (message.channel == channel_id) {
				setMessages(message._id, message);
			}
		});

		client.on('MessageDelete', ({ channel, id }) => {
			if (channel == channel_id) {
				setMessages(id, undefined);
			}
		});

		client.on('MessageUpdate', ({ channel, id, data }) => {
			if (channel == channel_id) {
				batch(() => {
					for (const [key, value] of Object.entries(data) as [
						keyof Message,
						Message[keyof Message]
					][]) {
						setMessages(id, key, value);
					}
				});
			}
		});

		client.on('MessageAppend', ({ id, channel, append }) => {
			if (channel == channel_id) {
				batch(() => {
					setMessages(id, 'embeds', (embeds) => {
						embeds?.push(...(append.embeds ?? []));
						return embeds;
					});
				});
			}
		});

		client.on('MessageReact', ({ id, user_id, channel_id: channel, emoji_id }) => {
			if (channel == channel_id) {
				setMessages(id, 'reactions', (reactions) => {
					reactions?.[emoji_id]?.push(user_id);
					return reactions;
				});
			}
		});

		client.on('MessageUnreact', ({ id, channel_id: channel, emoji_id, user_id }) => {
			if (channel == channel_id) {
				setMessages(id, 'reactions', (reactions) => {
					if (reactions?.[emoji_id] != undefined) {
						reactions[emoji_id] = reactions[emoji_id]!.filter((user) => user != user_id);
					}
					return reactions;
				});
			}
		});

		client.on('MessageRemoveReaction', ({ id, channel_id: channel, emoji_id }) => {
			if (channel == channel_id) {
				setMessages(id, 'reactions', emoji_id, undefined);
			}
		});

		client.on('BulkMessageDelete', ({ channel, ids }) => {
			if (channel == channel_id) {
				setMessages((messages) => {
					for (const id of ids) {
						delete messages[id];
					}
					return messages;
				});
			}
		});

		client.on('ChannelStartTyping', ({ id, user }) => {
			if (channel_id == id && user != session()?.user_id) {
				if (collection.typing.includes(user)) {
					return;
				}

				setTyping((typing) => [...typing, user]);
			}
		});

		client.on('ChannelStopTyping', ({ id, user }) => {
			if (channel_id == id && user != session()?.user_id) {
				setTyping((typing) => {
					typing = typing.filter((id) => id != user);
					return typing;
				});
			}
		});

		collection = {
			messages,
			users: Object.fromEntries(response.users.map((user) => [user._id, user])),
			members: Object.fromEntries(
				response.members?.map((member) => [member._id.user, member]) ?? []
			),
			typing
		};

		collections[channel_id] = collection;
	}

	return collection;
}
