import { createContext, type JSX, useContext, createComputed, onMount, onCleanup } from 'solid-js';
import ClientContext from '../client';
import { SessionContext } from '../session';
import api from '@lib/api';
import { createStore } from 'solid-js/store';
import { ReactiveMap } from '@solid-primitives/map';
import type { ClientEvents } from '@lib/client';

export const UnreadsCollectionContext = createContext(
	new ReactiveMap<ChannelUnread['_id']['channel'], CollectionItem<ChannelUnread>>()
);

export interface Props {
	children: JSX.Element;
}

export default function UnreadsCollectionProvider(props: Props) {
	const unreads = UnreadsCollectionContext.defaultValue;
	const client = useContext(ClientContext);
	const [session] = useContext(SessionContext);

	createComputed(() => {
		if (session() == undefined) {
			return;
		}

		api.fetchUnreads().then((unreadsArray) => {
			for (const unread of unreadsArray) {
				const [store, setStore] = createStore(unread);
				unreads.set(unread._id.channel, [store, setStore]);
			}
		});
	});

	onMount(() => {
		const messageHandler: ClientEvents['Message'] = (message) => {
			const item = unreads.get(message.channel);
			if (item == undefined) {
				const [store, setStore] = createStore<ChannelUnread>({
					_id: {
						channel: message.channel,
						user: session()!.user_id
					},
					mentions: message.mentions
				});
				unreads.set(message.channel, [store, setStore]);
				return;
			}
			const [, setUnread] = item;

			setUnread('mentions', (mentions) => [...(mentions ?? []), ...(message.mentions ?? [])]);
		};

		const channelAckHandler: ClientEvents['ChannelAck'] = ({ id, message_id, user }) => {
			const item = unreads.get(id);
			if (item == undefined) {
				const [store, setStore] = createStore<ChannelUnread>({
					_id: {
						channel: id,
						user
					},
					last_id: message_id
				});
				unreads.set(id, [store, setStore]);
				return;
			}

			const [, setUnread] = item;

			setUnread('last_id', message_id);
		};

		client.on('Message', messageHandler);
		client.on('ChannelAck', channelAckHandler);

		onCleanup(() => {
			client.removeListener('Message', messageHandler);
			client.removeListener('ChannelAck', channelAckHandler);
		});
	});

	return (
		<UnreadsCollectionContext.Provider value={unreads}>
			{props.children}
		</UnreadsCollectionContext.Provider>
	);
}
