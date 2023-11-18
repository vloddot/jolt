import { useContext } from 'solid-js';
import { SessionContext } from './context/session';
import { UserCollectionContext } from './context/collections/users';
import { createStore, type Store } from 'solid-js/store';
import { ChannelCollectionContext } from './context/collections/channels';
import { MemberCollectionContext } from './context/collections/members';

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

async function fetchChannel(id: string): Promise<Store<Channel>> {
	const channels = useContext(ChannelCollectionContext)();
	const channel = channels.get(id);

	if (channel == undefined) {
		const [store, setStore] = createStore<Channel>(
			await req('GET', `/channels/${id}`).then((response) => response.json())
		);

		channels.set(id, [store, setStore]);
		return store;
	}

	return channel[0];
}

async function queryMessages([channel_id, options]: [string, OptionsQueryMessages]): Promise<
	Extract<BulkMessageResponse, { messages: {} }>
> {
	const params =
		'?' +
		new URLSearchParams(
			Object.entries(options).flatMap(([key, value]) =>
				value == undefined ? [] : [[key, value.toString()]]
			)
		);

	const response: BulkMessageResponse = await req(
		'GET',
		`/channels/${channel_id}/messages${params}`
	).then((response) => response.json());

	if (Array.isArray(response)) {
		return {
			messages: response,
			users: []
		};
	} else {
		return response;
	}
}

async function fetchMember(id: MemberCompositeKey): Promise<Member> {
	const members = useContext(MemberCollectionContext)();
	const member = members.get(id);

	if (member == undefined) {
		const [store, setStore] = createStore<Member>(
			await req('GET', `/servers/${id.server}/members/${id.user}`).then((response) =>
				response.json()
			)
		);

		members.set(id, [store, setStore]);
		return store;
	}

	return member[0];
}

export default {
	req,
	login,
	fetchUser,
	fetchSettings,
	fetchDMs,
	fetchChannel,
	queryMessages,
	fetchMember
};
