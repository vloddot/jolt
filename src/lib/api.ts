import { useContext } from 'solid-js';
import { SessionContext } from './context/session';
import { UserCollectionContext } from './context/collections/users';
import { createStore, type Store } from 'solid-js/store';
import { ChannelCollectionContext } from './context/collections/channels';

async function req(
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
	path: string,
	body?: string
): Promise<Response> {
	const session = useContext(SessionContext)[0]();

	const response = await fetch(`https://api.revolt.chat${path}`, {
		method,
		body,
		headers: session?.token == undefined ? undefined : { 'x-session-token': session.token }
	});

	return response;
}

async function login(data_login: DataLogin): Promise<ResponseLogin> {
	return req('POST', '/auth/session/login', JSON.stringify(data_login)).then((response) =>
		response.json()
	);
}

async function fetchUser(id: string): Promise<Store<User>> {
	const users = useContext(UserCollectionContext)();
	const user = users.get(id);

	if (user == undefined) {
		const [store, setStore] = createStore<User>(
			await req('GET', `/users/${id}`).then((response) => response.json())
		);
		users.set(store._id, [store, setStore]);
		return store;
	}

	return user[0];
}

async function fetchDMs() {
	const channels = useContext(ChannelCollectionContext)();
	const dms: Channel[] = await req('GET', '/users/dms').then((response) => response.json());

	return dms.map((channel) => {
		const [store, setStore] = createStore(channel);
		channels.set(channel._id, [store, setStore]);
		return store as Store<
			Extract<Channel, { channel_type: 'DirectMessage' | 'Group' | 'SavedMessages' }>
		>;
	});
}

async function fetchSettings<K extends string>(keys: K[]): Promise<Record<K, [number, string]>> {
	return req('POST', '/sync/settings/fetch', JSON.stringify({ keys })).then((response) =>
		response.json()
	);
}

export default {
	req,
	login,
	fetchUser,
	fetchSettings,
	fetchDMs
};
