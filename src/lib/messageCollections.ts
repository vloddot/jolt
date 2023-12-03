import api from './api';
import { batch, onCleanup, onMount, useContext, createRoot } from 'solid-js';
import ClientContext from './context/Client';
import { createStore } from 'solid-js/store';
import { SessionContext } from './context/Session';
import type { ClientEvents } from './Client';
import { ReactiveSet } from '@solid-primitives/set';
import { UserCollectionContext } from './context/collections/Users';
import { MemberCollectionContext } from './context/collections/Members';
import util from './util';
import { SelectedServerIdContext } from './context/SelectedServerId';

export interface MessageCollection {
	messages: Record<Message['_id'], Message | undefined>;
	users: Record<User['_id'], User>;
	members: Record<Member['_id']['user'], Member>;
	typing: ReactiveSet<string>;
}

const collections: Record<string, MessageCollection> = {};

export async function getMessageCollection(channel_id: string): Promise<MessageCollection> {
	let collection = collections[channel_id];
	if (!collection) {
		const response = await api.queryMessages([channel_id, { sort: 'Latest', include_users: true }]);
		const client = useContext(ClientContext);
		const [session] = useContext(SessionContext);
		const userCollection = useContext(UserCollectionContext);
		const memberCollection = useContext(MemberCollectionContext);
		const selectedServerId = useContext(SelectedServerIdContext);

		collection = createRoot(() => {
			const [messages, setMessages] = createStore<MessageCollection['messages']>(
				Object.fromEntries(response.messages.reverse().map((message) => [message._id, message]))
			);
			const typing = new ReactiveSet<string>();

			onMount(() => {
				const messageHandler: ClientEvents['Message'] = (message) => {
					if (message.channel != channel_id) {
						return;
					}

					setMessages(message._id, message);
				};

				const messageDeleteHandler: ClientEvents['MessageDelete'] = ({ channel, id }) => {
					if (channel != channel_id) {
						return;
					}

					setMessages(id, undefined);
				};

				const bulkMessageDeleteHandler: ClientEvents['BulkMessageDelete'] = ({ channel, ids }) => {
					if (channel != channel_id) {
						return;
					}

					setMessages((messages) => {
						for (const id of ids) {
							delete messages[id];
						}
						return messages;
					});
				};

				const messageUpdateHandler: ClientEvents['MessageUpdate'] = ({ channel, id, data }) => {
					if (channel != channel_id) {
						return;
					}

					batch(() => {
						for (const [key, value] of Object.entries(data) as [
							keyof Message,
							Message[keyof Message]
						][]) {
							setMessages(id, key, value);
						}
					});
				};

				const messageAppendHandler: ClientEvents['MessageAppend'] = ({ id, channel, append }) => {
					if (channel != channel_id) {
						return;
					}

					batch(() => {
						setMessages(id, 'embeds', (embeds) => {
							embeds?.push(...(append.embeds ?? []));
							return embeds;
						});
					});
				};

				const messageReactHandler: ClientEvents['MessageReact'] = ({
					id,
					user_id,
					channel_id: channel,
					emoji_id
				}) => {
					if (channel != channel_id) {
						return;
					}

					setMessages(id, 'reactions', (reactions) => {
						reactions?.[emoji_id]?.push(user_id);
						return reactions;
					});
				};

				const messageUnreactHandler: ClientEvents['MessageUnreact'] = ({
					id,
					channel_id: channel,
					emoji_id,
					user_id
				}) => {
					if (channel != channel_id) {
						return;
					}

					setMessages(id, 'reactions', (reactions) => {
						if (reactions?.[emoji_id] != undefined) {
							reactions[emoji_id] = reactions[emoji_id]!.filter((user) => user != user_id);
						}
						return reactions;
					});
				};

				const messageRemoveReactionHandler: ClientEvents['MessageRemoveReaction'] = ({
					id,
					channel_id: channel,
					emoji_id
				}) => {
					if (channel != channel_id) {
						return;
					}

					setMessages(id, 'reactions', emoji_id, undefined);
				};

				// map for typing event timeouts
				const typingTimeouts: Map<User['_id'], NodeJS.Timeout> = new Map();

				const channelStartTypingHandler: ClientEvents['ChannelStartTyping'] = ({ id, user }) => {
					if (channel_id != id || user == session()?.user_id) {
						return;
					}

					// check if the user was already typing recently
					const typingTimeout = typingTimeouts.get(user);

					// if they were, clear their timeout because they sent another `ChannelStartTyping` event
					if (typingTimeout != undefined) {
						clearTimeout(typingTimeout);
					}

					// ...and set a new timeout
					typingTimeouts.set(
						user,
						setTimeout(
							() => channelStopTypingHandler({ id, user, type: 'ChannelStopTyping' }),
							3000
						)
					);

					typing.add(user);
				};

				const channelStopTypingHandler: ClientEvents['ChannelStopTyping'] = ({ id, user }) => {
					if (channel_id != id || user == session()?.user_id) {
						return;
					}

					typing.delete(user);
				};

				client.on('Message', messageHandler);
				client.on('MessageDelete', messageDeleteHandler);
				client.on('BulkMessageDelete', bulkMessageDeleteHandler);
				client.on('MessageUpdate', messageUpdateHandler);
				client.on('MessageAppend', messageAppendHandler);
				client.on('MessageReact', messageReactHandler);
				client.on('MessageUnreact', messageUnreactHandler);
				client.on('MessageRemoveReaction', messageRemoveReactionHandler);
				client.on('ChannelStartTyping', channelStartTypingHandler);
				client.on('ChannelStopTyping', channelStopTypingHandler);

				onCleanup(() => {
					for (const timeout of typingTimeouts.values()) {
						clearTimeout(timeout);
					}

					client.removeListener('Message', messageHandler);
					client.removeListener('MessageDelete', messageDeleteHandler);
					client.removeListener('BulkMessageDelete', bulkMessageDeleteHandler);
					client.removeListener('MessageUpdate', messageUpdateHandler);
					client.removeListener('MessageAppend', messageAppendHandler);
					client.removeListener('MessageReact', messageReactHandler);
					client.removeListener('MessageUnreact', messageUnreactHandler);
					client.removeListener('MessageRemoveReaction', messageRemoveReactionHandler);
					client.removeListener('ChannelStartTyping', channelStartTypingHandler);
					client.removeListener('ChannelStopTyping', channelStopTypingHandler);
				});
			});

			const users = Object.fromEntries(
				response.users.map((user) => {
					const u = userCollection.get(user._id);
					if (u == undefined) {
						const [store, setStore] = createStore(user);
						userCollection.set(user._id, [store, setStore]);
						return [user._id, store];
					}

					return [user._id, u[0]];
				})
			);

			let members = {};
			const server = selectedServerId();
			if (server != undefined && response.members != undefined) {
				members = Object.fromEntries(
					response.members.map((member) => {
						const m = memberCollection.get(util.hashMemberId(member._id));

						if (m == undefined) {
							const [store, setStore] = createStore(member);
							memberCollection.set(util.hashMemberId(member._id), [store, setStore]);
							return [member._id.user, store];
						}

						return [member._id.user, m];
					})
				);
			}

			return {
				messages,
				users,
				members,
				typing
			};
		});

		collections[channel_id] = collection;
	}

	return collection;
}
