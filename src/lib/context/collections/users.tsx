import {
	createContext,
	createSignal,
	useContext,
	type JSX,
	batch,
	type Accessor,
	onMount,
	onCleanup
} from 'solid-js';
import ClientContext from '@lib/context/client';
import { createStore } from 'solid-js/store';
import type { ClientEvents } from '@lib/client';

export type UserCollection = Map<User['_id'], CollectionItem<User>>;
export const UserCollectionContext = createContext<Accessor<UserCollection>>(() => new Map());

interface Props {
	children: JSX.Element;
}

export default function UserCollectionProvider(props: Props) {
	const [users, setUsers] = createSignal<UserCollection>(UserCollectionContext.defaultValue());
	const client = useContext(ClientContext);

	onMount(() => {
		const readyHandler: ClientEvents['Ready'] = ({ users }) => {
			setUsers(
				new Map(
					users.map((user) => {
						// eslint-disable-next-line solid/reactivity
						return [user._id, createStore(user)];
					})
				)
			);
		};

		const userUpdateHandler: ClientEvents['UserUpdate'] = (m) => {
			const u = users().get(m.id);
			if (u == undefined) {
				return;
			}

			const [, setUser] = u;

			batch(() => {
				if (m.clear != undefined) {
					for (const clear of m.clear) {
						swtch: switch (clear) {
							case 'Avatar': {
								setUser('avatar', undefined);
								break swtch;
							}
							case 'StatusText': {
								setUser('status', 'text', undefined);
								break swtch;
							}
							case 'StatusPresence': {
								setUser('status', 'presence', undefined);
								break swtch;
							}
							case 'ProfileContent': {
								setUser('profile', 'content', undefined);
								break swtch;
							}
							case 'ProfileBackground': {
								setUser('profile', 'background', undefined);
								break swtch;
							}
							case 'DisplayName': {
								setUser('display_name', undefined);
								break swtch;
							}
						}
					}
				}

				for (const [key, value] of Object.entries(m.data) as [keyof User, never][]) {
					setUser(key, value);
				}
			});
		};

		const userRelationshipHandler: ClientEvents['UserRelationship'] = (message) => {
			const user = users().get(message.user._id);
			if (user == undefined) {
				setUsers((users) => {
					const [store, setStore] = createStore(message.user);
					users.set(message.user._id, [store, setStore]);
					return users;
				});
			} else {
				const [, setUser] = user;
				setUser('relationship', message.user.relationship);
			}
		};

		const userPresenceHandler: ClientEvents['UserPresence'] = (m) => {
			const user = users().get(m.id);
			if (user == undefined) {
				return;
			}

			const [, setUser] = user;
			setUser('online', m.online);
		};

		const userPlatformWipeHandler: ClientEvents['UserPlatformWipe'] = (m) => {
			const user = users().get(m.user_id);
			if (user == undefined) {
				return;
			}

			const [, setUser] = user;
			setUser('flags', m.flags);
		};

		client.on('Ready', readyHandler);
		client.on('UserUpdate', userUpdateHandler);
		client.on('UserRelationship', userRelationshipHandler);
		client.on('UserPresence', userPresenceHandler);
		client.on('UserPlatformWipe', userPlatformWipeHandler);

		onCleanup(() => {
			client.removeListener('Ready', readyHandler);
			client.removeListener('UserUpdate', userUpdateHandler);
			client.removeListener('UserRelationship', userRelationshipHandler);
			client.removeListener('UserPresence', userPresenceHandler);
			client.removeListener('UserPlatformWipe', userPlatformWipeHandler);
		});
	});

	return (
		<UserCollectionContext.Provider value={users}>{props.children}</UserCollectionContext.Provider>
	);
}
