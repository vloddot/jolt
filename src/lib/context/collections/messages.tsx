import {
	createContext,
	useContext,
	type JSX,
	type Signal,
	batch,
	createSignal,
	type Accessor
} from 'solid-js';
import ClientContext from '../client';
import { createStore } from 'solid-js/store';
import { UserCollectionContext } from './users';
import { MemberCollectionContext } from './members';
import util from '@lib/util';

export interface MessageCollection {
	messages: Map<Message['_id'], CollectionItem<Message>>;
	users: Map<User['_id'], CollectionItem<User>>;
	members: Map<Member['_id']['user'], CollectionItem<Member>>;
	server?: Server;
}

export const MessageCollectionContext = createContext<
	[
		Accessor<Map<string, Signal<MessageCollection>>>,
		{
			initChannelCollection(
				id: string,
				messages: Extract<BulkMessageResponse, { messages: Message[] }>,
				server?: Server
			): Accessor<MessageCollection>;
		}
	]
>();

export interface Props {
	children: JSX.Element;
}

export default function MessageCollectionProvider(props: Props) {
	const userCollection = useContext(UserCollectionContext);
	const memberCollection = useContext(MemberCollectionContext);
	const client = useContext(ClientContext);
	const [messageCollections, setMessageCollections] = createSignal(
		new Map<string, Signal<MessageCollection>>()
	);

	// eslint-disable-next-line solid/reactivity
	client.on('Message', (message) => {
		const [store, setStore] = createStore(message);

		const item = messageCollections().get(message.channel);

		// does not make a new channel key
		// only pushes to a list if the channel exists
		if (item == undefined) {
			return;
		}

		const [, setCollection] = item;

		setCollection((collection) => {
			collection.messages.set(message._id, [store, setStore]);
			return collection;
		});
	});

	// eslint-disable-next-line solid/reactivity
	client.on('MessageUpdate', ({ id, channel, data }) => {
		messageCollections().get(channel)?.[1]((collection) => {
			const item = collection.messages.get(id);
			if (item == undefined) {
				return collection;
			}

			const [, setMessage] = item;
			batch(() => {
				for (const [key, value] of Object.entries(data) as [keyof Message, never][]) {
					setMessage(key, value);
				}
			});

			return collection;
		});
	});

	// eslint-disable-next-line solid/reactivity
	client.on('MessageDelete', ({ id, channel }) => {
		messageCollections().get(channel)?.[1]((collection) => {
			collection.messages.delete(id);
			return collection;
		});
	});

	return (
		<MessageCollectionContext.Provider
			value={[
				messageCollections,
				{
					initChannelCollection(id, response, server) {
						const cached = messageCollections().get(id);
						if (cached != undefined) {
							return cached[0];
						}

						const [collection, setCollection] = createSignal<MessageCollection>({
							messages: new Map(
								response.messages.reverse().map((message) => {
									const [store, setStore] = createStore(message);
									return [message._id, [store, setStore]];
								})
							),
							users: new Map(
								response.users.map((user) => {
									const cachedUser = userCollection().get(user._id);
									if (cachedUser == undefined) {
										const [store, setStore] = createStore(user);
										userCollection().set(user._id, [store, setStore]);
										return [user._id, [store, setStore]];
									}

									return [cachedUser[0]._id, cachedUser];
								})
							),
							members: new Map(
								response.members?.map((member) => {
									const memberIdHash = util.hashMemberId(member._id);
									const cachedMember = memberCollection().get(memberIdHash);
									if (cachedMember == undefined) {
										const [store, setStore] = createStore(member);
										memberCollection().set(memberIdHash, [store, setStore]);
										return [member._id.user, [store, setStore]];
									}

									return [cachedMember[0]._id.user, cachedMember];
								})
							),
							server
						});

						// eslint-disable-next-line solid/reactivity
						setMessageCollections((collections) => {
							// eslint-disable-next-line solid/reactivity
							collections.set(id, [collection, setCollection]);
							return collections;
						});
						return collection;
					}
				}
			]}
		>
			{props.children}
		</MessageCollectionContext.Provider>
	);
}
