import { useContext } from 'solid-js';
import { SessionContext } from './context/session';
import { UserCollectionContext } from './context/collections/users';
import { createStore, type Store } from 'solid-js/store';
import { ChannelCollectionContext } from './context/collections/channels';
import { MemberCollectionContext } from './context/collections/members';
import { ServerCollectionContext } from './context/collections/servers';
import util from './util';

function req(
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
	path: string,
	body?: string
): Promise<Response> {
	return new Promise((resolve, reject) => {
		const session = useContext(SessionContext)[0]();

		fetch(`https://api.revolt.chat${path}`, {
			method,
			body,
			headers: session?.token == undefined ? undefined : { 'x-session-token': session.token }
		})
			.then((response) => {
				if (response.status == 429) {
					response
						.json()
						.then(({ retry_after }) =>
							setTimeout(() => req(method, path, body).then(resolve).catch(reject), retry_after)
						)
						.catch(reject);
				}

				resolve(response);
			})
			.catch(reject);
	});
}

async function login(data: DataLogin): Promise<ResponseLogin> {
	return req('POST', '/auth/session/login', JSON.stringify(data)).then((response) =>
		response.json()
	);
}

async function fetchUser(target: string): Promise<Store<User>> {
	const users = useContext(UserCollectionContext)();
	const user = users.get(target);

	if (user == undefined) {
		const [store, setStore] = createStore<User>(
			await req('GET', `/users/${target}`).then((response) => response.json())
		);
		// eslint-disable-next-line solid/reactivity
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

async function fetchChannel(target: string): Promise<Store<Channel>> {
	const channels = useContext(ChannelCollectionContext)();
	const channel = channels.get(target);

	if (channel == undefined) {
		const [store, setStore] = createStore<Channel>(
			await req('GET', `/channels/${target}`).then((response) => response.json())
		);

		channels.set(target, [store, setStore]);
		return store;
	}

	return channel[0];
}

async function queryMessages([target, options]: [string, OptionsQueryMessages]): Promise<
	Extract<BulkMessageResponse, { messages: Message[] }>
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
		`/channels/${target}/messages${params}`
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

async function fetchMember(target: MemberCompositeKey): Promise<Member> {
	const members = useContext(MemberCollectionContext)();
	const member = members.get(util.hashMemberId(target));

	if (member == undefined) {
		const [store, setStore] = createStore<Member>(
			await req('GET', `/servers/${target.server}/members/${target.user}`).then((response) =>
				response.json()
			)
		);

		members.set(util.hashMemberId(target), [store, setStore]);
		return store;
	}

	return member[0];
}

async function sendMessage(target: string, data: DataMessageSend): Promise<Message> {
	return req('POST', `/channels/${target}/messages`, JSON.stringify(data)).then((response) =>
		response.json()
	);
}

async function deleteMessage(target: string, msg: string): Promise<void> {
	await req('DELETE', `/channels/${target}/messages/${msg}`);
}

async function fetchServer(target: string): Promise<Server> {
	const servers = useContext(ServerCollectionContext)();
	const server = servers.get(target);

	if (server == undefined) {
		const [store, setStore] = createStore<Server>(
			await req('GET', `/servers/${target}`).then((response) => response.json())
		);
		servers.set(target, [store, setStore]);
		return store;
	}

	return server[0];
}

async function uploadAttachment(file: File, tag = 'attachments'): Promise<string> {
	const form = new FormData();

	form.append('file', file);

	const { id } = await fetch(`https://autumn.revolt.chat/${tag}`, {
		method: 'POST',
		body: form
	}).then((response) => response.json());

	return id;
}

export default {
	req,
	login,
	fetchUser,
	fetchSettings,
	fetchDMs,
	fetchChannel,
	fetchServer,
	queryMessages,
	sendMessage,
	fetchMember,
	deleteMessage,
	uploadAttachment
};
