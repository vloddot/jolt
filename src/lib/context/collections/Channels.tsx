import { createContext, useContext, type JSX, batch, onMount, onCleanup } from 'solid-js';
import ClientContext from '@lib/context/Client';
import { createStore } from 'solid-js/store';
import type { ClientEvents } from '@lib/Client';
import { ReactiveMap } from '@solid-primitives/map';

export const ChannelCollectionContext = createContext(
	new ReactiveMap<Channel['_id'], CollectionItem<Channel>>()
);

interface Props {
	children: JSX.Element;
}

export default function ChannelCollectionProvider(props: Props) {
	const channels = ChannelCollectionContext.defaultValue;
	const client = useContext(ClientContext);

	onMount(() => {
		const readyHandler: ClientEvents['Ready'] = ({ channels: channelsArray }) => {
			for (const channel of channelsArray) {
				const [store, setStore] = createStore(channel);
				channels.set(channel._id, [store, setStore]);
			}
		};

		const channelCreateHandler: ClientEvents['ChannelCreate'] = (channel) => {
			const [store, setStore] = createStore(channel);
			channels.set(channel._id, [store, setStore]);
		};

		const channelDeleteHandler: ClientEvents['ChannelDelete'] = ({ id }) => {
			channels.delete(id);
		};

		const channelUpdateHandler: ClientEvents['ChannelUpdate'] = (m) => {
			const c = channels.get(m.id);
			if (c == undefined) {
				return;
			}

			const [channel, setChannel] = c;

			batch(() => {
				if (m.clear != undefined) {
					for (const clear of m.clear) {
						if (
							channel.channel_type != 'Group' &&
							channel.channel_type != 'TextChannel' &&
							channel.channel_type != 'VoiceChannel'
						) {
							break;
						}

						swtch: switch (clear) {
							case 'Description': {
								setChannel('description' as keyof Channel, undefined as never);
								break swtch;
							}
							case 'Icon': {
								setChannel('icon' as keyof Channel, undefined as never);
								break swtch;
							}
							case 'DefaultPermissions': {
								if (channel.channel_type != 'Group') {
									setChannel('default_permissions' as keyof Channel, undefined as never);
								}
								break swtch;
							}
						}
					}

					for (const [key, value] of Object.entries(m.data)) {
						setChannel(key as keyof Channel, value);
					}
				}

				return channel;
			});
		};

		const channelGroupJoinHandler: ClientEvents['ChannelGroupJoin'] = (m) => {
			const g = channels.get(m.id);
			if (g == undefined) {
				return;
			}

			const [group, setGroup] = g;

			if (group.channel_type == 'Group') {
				setGroup('recipients' as keyof Channel, [...group.recipients, m.user] as never);
			}
		};

		const channelGroupLeaveHandler: ClientEvents['ChannelGroupLeave'] = (m) => {
			const g = channels.get(m.id);
			if (g == undefined) {
				return;
			}

			const [group, setGroup] = g;

			if (group.channel_type == 'Group') {
				setGroup(
					'recipients' as keyof Channel,
					group.recipients.filter((user) => user != m.user) as never
				);
			}
		};

		const messageHandler: ClientEvents['Message'] = ({ channel: channel_id, _id: message_id }) => {
			const store = channels.get(channel_id);

			if (store == undefined) {
				return;
			}

			const [channel, setChannel] = store;

			if (channel.channel_type == 'VoiceChannel' || channel.channel_type == 'SavedMessages') {
				return;
			}

			setChannel('last_message_id' as keyof Channel, message_id);
		};

		client.on('Ready', readyHandler);
		client.on('ChannelCreate', channelCreateHandler);
		client.on('ChannelDelete', channelDeleteHandler);
		client.on('ChannelUpdate', channelUpdateHandler);
		client.on('ChannelGroupJoin', channelGroupJoinHandler);
		client.on('ChannelGroupLeave', channelGroupLeaveHandler);
		client.on('Message', messageHandler);

		onCleanup(() => {
			client.removeListener('Ready', readyHandler);
			client.removeListener('ChannelCreate', channelCreateHandler);
			client.removeListener('ChannelDelete', channelDeleteHandler);
			client.removeListener('ChannelUpdate', channelUpdateHandler);
			client.removeListener('ChannelGroupJoin', channelGroupJoinHandler);
			client.removeListener('ChannelGroupLeave', channelGroupLeaveHandler);
			client.removeListener('Message', messageHandler);
		});
	});

	return (
		<ChannelCollectionContext.Provider value={channels}>
			{props.children}
		</ChannelCollectionContext.Provider>
	);
}
