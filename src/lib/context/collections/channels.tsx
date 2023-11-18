import { createContext, createSignal, useContext, type JSX, batch, type Accessor } from 'solid-js';
import ClientContext from '@lib/context/client';
import { createStore } from 'solid-js/store';

export type ChannelCollection = Map<Channel['_id'], CollectionItem<Channel>>;
export const ChannelCollectionContext = createContext<Accessor<ChannelCollection>>(() => new Map());

interface Props {
	children: JSX.Element;
}

export default function ChannelCollectionProvider(props: Props) {
	const [channels, setChannels] = createSignal<ChannelCollection>(
		ChannelCollectionContext.defaultValue()
	);
	const client = useContext(ClientContext);

	client.on('Ready', ({ channels }) => {
		setChannels(new Map(channels.map((channel) => [channel._id, createStore(channel)])));
	});

	client.on('ChannelCreate', (channel) => {
		setChannels((channels) => {
			channels.set(channel._id, createStore(channel));
			return channels;
		});
	});

	client.on('ChannelDelete', ({ id }) => {
		setChannels((channels) => {
			channels.delete(id);
			return channels;
		});
	});

	client.on('ChannelUpdate', (m) => {
		const c = channels().get(m.id);
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
	});

	client.on('ChannelGroupJoin', (m) => {
		const g = channels().get(m.id);
		if (g == undefined) {
			return;
		}

		const [group, setGroup] = g;

		if (group.channel_type == 'Group') {
			setGroup('recipients' as keyof Channel, [...group.recipients, m.user] as never);
		}
	});

	client.on('ChannelGroupLeave', (m) => {
		const g = channels().get(m.id);
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
	});

	client.on('Message', ({ channel: channel_id, _id: message_id }) => {
		const store = channels().get(channel_id);

		if (store == undefined) {
			return;
		}

		const [channel, setChannel] = store;

		if (channel.channel_type == 'VoiceChannel' || channel.channel_type == 'SavedMessages') {
			return;
		}

		setChannel('last_message_id' as keyof Channel, message_id);
	});

	return (
		<ChannelCollectionContext.Provider value={channels}>
			{props.children}
		</ChannelCollectionContext.Provider>
	);
}
