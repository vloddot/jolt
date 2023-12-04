import { useContext } from 'solid-js';
import { SessionContext } from './context/Session';
import { UserCollectionContext } from './context/collections/Users';
import { createStore, type Store } from 'solid-js/store';
import { ChannelCollectionContext } from './context/collections/Channels';
import { MemberCollectionContext } from './context/collections/Members';
import util from './util';

function req(
	method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
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
				if (response.ok) {
					resolve(response);
				} else {
					reject(response);
				}
			})
			.catch(reject);
	});
}

async function login(data: DataLogin): Promise<ResponseLogin> {
	return req('POST', '/auth/session/login', JSON.stringify(data)).then((response) =>
		response.json()
	);
}

function fetchUser(target: string): Promise<Store<User>> {
	return new Promise((resolve, reject) => {
		const users = useContext(UserCollectionContext);
		const user = users.get(target);

		if (user == undefined) {
			req('GET', `/users/${target}`)
				.then((response) => response.json())
				.then((user: User) => {
					const [store, setStore] = createStore(user);
					users.set(target, [store, setStore]);
					resolve(store);
				})
				.catch(reject);
			return;
		}

		resolve(user[0]);
	});
}

async function fetchDMs() {
	const channels = useContext(ChannelCollectionContext);
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
	const channels = useContext(ChannelCollectionContext);
	const item = channels.get(target);

	if (item == undefined) {
		const [store, setStore] = createStore<Channel>(
			await req('GET', `/channels/${target}`).then((response) => response.json())
		);

		channels.set(target, [store, setStore]);
		return store;
	}

	const [channel] = item;

	return channel;
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

function fetchMembers(target: string): Promise<AllMemberResponseMap> {
	return new Promise((resolve, reject) => {
		req('GET', `/servers/${target}/members`)
			.then((response) => response.json())
			.then((response: AllMemberResponse) => {
				resolve({
					members: new Map(response.members.map((member) => [member._id.user, member])),
					users: new Map(response.users.map((user) => [user._id, user]))
				});
				const members = useContext(MemberCollectionContext);
				for (const member of response.members) {
					const [store, setStore] = createStore(member);
					members.set(util.hashMemberId(member._id), [store, setStore]);
				}
			})
			.catch(reject);
	});
}

function fetchMember(target: MemberCompositeKey): Promise<Member> {
	return new Promise((resolve, reject) => {
		const members = useContext(MemberCollectionContext);
		const member = members.get(util.hashMemberId(target));

		if (member == undefined) {
			req('GET', `/servers/${target.server}/members/${target.user}`)
				.then((response) => response.json())
				.then((member: Member) => {
					const [store, setStore] = createStore(member);
					members.set(util.hashMemberId(target), [store, setStore]);
					resolve(store);
				})
				.catch(reject);
			return;
		}

		resolve(member?.[0]);
	});
}

async function sendMessage(target: string, data: DataMessageSend): Promise<Message> {
	return req('POST', `/channels/${target}/messages`, JSON.stringify(data)).then((response) =>
		response.json()
	);
}

async function deleteMessage(target: string, msg: string): Promise<void> {
	await req('DELETE', `/channels/${target}/messages/${msg}`);
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

async function editMessage(
	channel_id: string,
	message_id: string,
	data: DataEditMessage
): Promise<Message> {
	return req('PATCH', `/channels/${channel_id}/messages/${message_id}`, JSON.stringify(data)).then(
		(response) => response.json()
	);
}

async function fetchMessage([channel_id, target]: [string, string]): Promise<Message> {
	return req('GET', `/channels/${channel_id}/messages/${target}`).then((response) =>
		response.json()
	);
}

async function fetchUnreads(): Promise<ChannelUnread[]> {
	return req('GET', '/sync/unreads').then((response) => response.json());
}

async function ackMessage(target: string, message: string): Promise<void> {
	await req('PUT', `/channels/${target}/ack/${message}`);
}

export default {
	req,
	login,
	fetchUser,
	fetchSettings,
	fetchDMs,
	fetchChannel,
	fetchMembers,
	fetchMessage,
	fetchUnreads,
	queryMessages,
	sendMessage,
	fetchMember,
	deleteMessage,
	uploadAttachment,
	editMessage,
	ackMessage
};
