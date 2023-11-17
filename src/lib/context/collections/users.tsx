import { createContext, createSignal, useContext, type JSX, batch, type Accessor } from 'solid-js';
import ClientContext from '@lib/context/client';
import type { CollectionItem } from '.';
import { createStore } from 'solid-js/store';

export type UserCollection = Map<User['_id'], CollectionItem<User>>;
export const UserCollectionContext = createContext<Accessor<UserCollection>>(() => new Map());

interface Props {
	children: JSX.Element;
}

export default function UserCollectionProvider(props: Props) {
	const [users, setUsers] = createSignal<UserCollection>(UserCollectionContext.defaultValue());
	const client = useContext(ClientContext);

	client.on('Ready', ({ users }) => {
		setUsers(new Map(users.map((user) => [user._id, createStore(user)])));
	});

	client.on('UserUpdate', (m) => {
		const u = users().get(m.id);
		if (u == undefined) {
			return;
		}

		const [user, setUser] = u;

		batch(() => {
			if (m.clear != undefined) {
				for (const clear of m.clear) {
					swtch: switch (clear) {
						case 'Avatar': {
							setUser('avatar', undefined);
							break swtch;
						}
						case 'StatusText': {
							if (user.status != undefined) {
								setUser('status', 'text', undefined);
							}
							break swtch;
						}
						case 'StatusPresence': {
							if (user.status != undefined) {
								setUser('status', 'presence', undefined);
							}
							break swtch;
						}
						case 'ProfileContent': {
							if (user.profile?.content != undefined) {
								setUser('profile', 'content', undefined);
							}
							break swtch;
						}
						case 'ProfileBackground': {
							if (user.profile?.background != undefined) {
								setUser('profile', 'background', undefined);
							}
							break swtch;
						}
						case 'DisplayName': {
							setUser('display_name', undefined);
							break swtch;
						}
					}
				}
			}

			for (const [key, value] of Object.entries(m.data)) {
				user[key as keyof User] = value as never;
			}

			return user;
		});
	});

	client.on('UserRelationship', (message) => {
		const user = users().get(message.user._id);
		if (user == undefined) {
			setUsers((users) => {
				users.set(message.user._id, createStore(message.user));
				return users;
			});
		} else {
			const [, setUser] = user;
			setUser('relationship', message.user.relationship);
		}
	});

	client.on('UserPresence', (m) => {
		const user = users().get(m.id);
		if (user == undefined) {
			return;
		}

		const [, setUser] = user;
		setUser('online', m.online);
	});

	client.on('UserPlatformWipe', (m) => {
		const user = users().get(m.user_id);
		if (user == undefined) {
			return;
		}

		const [, setUser] = user;
		setUser('flags', m.flags);
	});

	return (
		<UserCollectionContext.Provider value={users}>
			{props.children}
		</UserCollectionContext.Provider>
	);
}
