import { createContext, useContext, type JSX, batch, onMount, onCleanup } from 'solid-js';
import ClientContext from '@lib/context/Client';
import { createStore } from 'solid-js/store';
import type { ClientEvents } from '@lib/Client';
import { ReactiveMap } from '@solid-primitives/map';

export const UserCollectionContext = createContext(
	new ReactiveMap<User['_id'], CollectionItem<User>>()
);

interface Props {
	children: JSX.Element;
}

export default function UserCollectionProvider(props: Props) {
	const users = UserCollectionContext.defaultValue;
	const client = useContext(ClientContext);

	onMount(() => {
		const readyHandler: ClientEvents['Ready'] = ({ users: usersArray }) => {
			for (const user of usersArray) {
				const [store, setStore] = createStore(user);
				users.set(user._id, [store, setStore]);
			}
		};

		const userUpdateHandler: ClientEvents['UserUpdate'] = (m) => {
			const u = users.get(m.id);
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

		const userRelationshipHandler: ClientEvents['UserRelationship'] = (m) => {
			const user = users.get(m.user._id);
			if (user == undefined) {
				const [store, setStore] = createStore({ ...m.user, relationship: m.status });
				users.set(m.user._id, [store, setStore]);
			} else {
				const [, setUser] = user;
				setUser('relationship', m.status);
			}
		};

		const userPresenceHandler: ClientEvents['UserPresence'] = (m) => {
			const user = users.get(m.id);
			if (user == undefined) {
				return;
			}

			const [, setUser] = user;
			setUser('online', m.online);
		};

		const userPlatformWipeHandler: ClientEvents['UserPlatformWipe'] = (m) => {
			const user = users.get(m.user_id);
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
