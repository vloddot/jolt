import EventEmitter from 'eventemitter3';
import { APIClient } from './APIClient';
import { AutumnClient } from './AutumnClient';
import { WebSocketClient, type ServerToClientMessage } from './WebSocketClient';
import { mapById } from './util';
import { type SetStoreFunction, type Store, createStore, produce } from 'solid-js/store';
import { createSignal, type Accessor, type Setter } from 'solid-js';

export type Events<T extends { type: string | number | symbol }> = {
	[K in Exclude<T['type'], 'Bulk'>]: (event: Extract<T, { type: K }>) => void;
};

const UNKNOWN_USER: User = {
	_id: '0'.repeat(26),
	discriminator: '0000',
	username: '<Unknown User>'
};

type Cache = {
	channels: Map<Channel['_id'], [Store<Channel>, SetStoreFunction<Channel>]>;
	emojis: Map<Emoji['_id'], [Store<Emoji>, SetStoreFunction<Emoji>]>;
	members: Map<Member['_id'], [Store<Member>, SetStoreFunction<Member>]>;
	servers: Map<Server['_id'], [Store<Server>, SetStoreFunction<Server>]>;
	users: Map<User['_id'], [Store<User>, SetStoreFunction<User>]>;
};

type MapValue<M> = M extends Map<unknown, infer I> ? I : never;
type ChannelUnreadCollection = Map<ChannelUnread['_id']['channel'], ChannelUnread>;

export class Client extends EventEmitter<Events<ServerToClientMessage>> {
	cache: Cache = {
		channels: new Map(),
		emojis: new Map(),
		members: new Map(),
		servers: new Map(),
		users: new Map()
	};

	readonly api = new APIClient();
	readonly websocket = new WebSocketClient();
	readonly autumn = new AutumnClient();
	readonly user: Accessor<User>;
	readonly #setUser: Setter<User>;
	readonly session: Accessor<ResponseLogin>;
	readonly setSession: Setter<ResponseLogin>;
	readonly unreads: Accessor<ChannelUnreadCollection>;
	readonly #setUnreads: Setter<ChannelUnreadCollection>;

	constructor() {
		super();

		[this.user, this.#setUser] = createSignal<User>(UNKNOWN_USER);
		[this.session, this.setSession] = createSignal<ResponseLogin>({
			result: 'Success',
			_id: '0'.repeat(26),
			user_id: '0'.repeat(26),
			name: 'Unknown',
			token: ''
		});

		[this.unreads, this.#setUnreads] = createSignal(new Map());
	}

	authenticate(session: Extract<ResponseLogin, { result: 'Success' }>) {
		this.setSession(session);

		this.api.token = session.token;
		this.websocket.authenticate(session.token);

		this.fetchUser('@me').then(([user]) => this.#setUser(user));
		this.fetchUnreads().then((unreads) =>
			this.#setUnreads(
				produce(() =>
					mapById(unreads, {
						getId: (o) => o._id.channel
					})
				)
			)
		);

		this.websocket.on('serverEvent', (event) => this.#handleEvent(event));
	}

	async destroy() {
		await this.logout();
		this.websocket.disconnect();
		this.api.token = undefined;
		this.#setUser(UNKNOWN_USER);
		this.#setUnreads(new Map());
		this.cache = {
			channels: new Map(),
			emojis: new Map(),
			members: new Map(),
			servers: new Map(),
			users: new Map()
		};
	}

	#handleEvent(event: ServerToClientMessage) {
		switch (event.type) {
			case 'Bulk': {
				for (const e of event.v) {
					this.#handleEvent(e);
				}
				break;
			}
			case 'Ready': {
				// map by ID and wrap each object in a `Writable`
				this.cache.users = mapById(event.users, { getObject: createStore });
				this.cache.channels = mapById(event.channels, { getObject: createStore });
				this.cache.servers = mapById(event.servers, { getObject: createStore });
				this.cache.members = mapById(event.members, { getObject: createStore });
				this.cache.emojis = mapById(event.emojis, { getObject: createStore });

				this.emit('Ready', event);
				break;
			}
			case 'ChannelCreate': {
				this.cache.channels.set(event._id, createStore(event));
				this.emit('ChannelCreate', event);
				break;
			}
			case 'ChannelDelete': {
				// only emit event if the channel existed
				if (this.cache.channels.delete(event.id)) {
					this.emit('ChannelDelete', event);
				}
				break;
			}
			case 'ChannelUpdate': {
				const c = this.cache.channels.get(event.id);
				if (c == undefined) {
					return;
				}
				const [, setChannel] = c;

				setChannel((channel) => {
					if (event.clear != undefined) {
						for (const clear of event.clear) {
							if (
								channel.channel_type != 'Group' &&
								channel.channel_type != 'TextChannel' &&
								channel.channel_type != 'VoiceChannel'
							) {
								break;
							}

							swtch: switch (clear) {
								case 'Description': {
									delete channel.description;
									break swtch;
								}
								case 'Icon': {
									delete channel.icon;
									break swtch;
								}
								case 'DefaultPermissions': {
									if (channel.channel_type != 'Group') {
										delete channel.default_permissions;
									}
									break swtch;
								}
							}
						}
					}

					for (const [key, value] of Object.entries(event.data)) {
						channel[key as keyof Channel] = value;
					}

					return channel;
				});

				this.emit('ChannelUpdate', event);
				break;
			}
			case 'ServerCreate': {
				this.cache.servers.set(event.id, createStore(event.server));
				this.emit('ServerCreate', event);
				break;
			}
			case 'ServerDelete': {
				this.cache.servers.delete(event.id);
				this.emit('ServerDelete', event);
				break;
			}
			case 'ServerUpdate': {
				const s = this.cache.servers.get(event.id);
				if (s == undefined) {
					return;
				}

				const [, setServer] = s;

				setServer((server) => {
					if (event.clear != undefined) {
						for (const clear of event.clear) {
							swtch: switch (clear) {
								case 'Description':
									delete server.description;
									break swtch;
								case 'Icon':
									delete server.icon;
									break swtch;
								case 'Categories':
									delete server.categories;
									break swtch;
								case 'SystemMessages':
									delete server.system_messages;
									break swtch;
								case 'Banner':
									delete server.banner;
									break swtch;
							}
						}
					}

					for (const [key, value] of Object.entries(event.data)) {
						server[key as keyof Server] = value as never;
					}

					return server;
				});

				this.emit('ServerUpdate', event);
				break;
			}
			case 'ChannelGroupJoin': {
				const g = this.cache.channels.get(event.id);
				if (g == undefined) {
					return;
				}

				const [, setGroup] = g;

				setGroup((group) => {
					if (group.channel_type != 'Group') {
						return group;
					}

					group.recipients.push(event.user);

					this.emit('ChannelGroupJoin', event);
					return group;
				});
				break;
			}
			case 'ChannelGroupLeave': {
				const g = this.cache.channels.get(event.id);
				if (g == undefined) {
					return;
				}

				const [, setGroup] = g;

				setGroup((group) => {
					if (group.channel_type != 'Group') {
						return group;
					}

					group.recipients = group.recipients.filter((user) => user != event.user);

					this.emit('ChannelGroupLeave', event);
					return group;
				});
				break;
			}
			case 'ServerMemberUpdate': {
				const m = this.cache.members.get(event.id);
				if (m == undefined) {
					return;
				}

				const [, setMember] = m;

				setMember((member) => {
					if (event.clear != undefined) {
						for (const clear of event.clear) {
							switch (clear) {
								case 'Nickname':
									delete member.nickname;
									break;
								case 'Avatar':
									delete member.avatar;
									break;
								case 'Roles':
									delete member.roles;
									break;
								case 'Timeout':
									delete member.timeout;
							}
						}
					}

					for (const [key, value] of Object.entries(event.data)) {
						member[key as keyof Member] = value as never;
					}

					return member;
				});

				this.emit('ServerMemberUpdate', event as never);
				break;
			}
			case 'ServerRoleUpdate': {
				const s = this.cache.servers.get(event.id);
				if (s == undefined) {
					return;
				}

				const [, setServer] = s;

				setServer((server) => {
					if (server.roles == undefined) {
						return server;
					}

					for (const [key, role] of Object.entries(event.data)) {
						server.roles[event.role_id][key as keyof Role] = role as never;
					}

					return server;
				});

				this.emit('ServerRoleUpdate', event);
				break;
			}
			case 'ServerRoleDelete': {
				const s = this.cache.servers.get(event.id);
				if (s == undefined) {
					return;
				}

				const [, setServer] = s;
				setServer((server) => {
					if (server.roles == undefined) {
						return server;
					}

					delete server.roles[event.role_id];
					return server;
				});

				this.emit('ServerRoleDelete', event);
				break;
			}
			case 'UserUpdate': {
				const u = this.cache.users.get(event.id);
				if (u == undefined) {
					return;
				}

				const [, setUser] = u;
				setUser((user) => {
					if (event.clear != undefined) {
						for (const clear of event.clear) {
							swtch: switch (clear) {
								case 'Avatar': {
									delete user.avatar;
									break swtch;
								}
								case 'StatusText': {
									if (user.status != undefined) {
										delete user.status.text;
									}
									break swtch;
								}
								case 'StatusPresence': {
									if (user.status != undefined) {
										delete user.status.presence;
									}
									break swtch;
								}
								case 'ProfileContent': {
									if (user.profile != undefined) {
										delete user.profile.content;
									}
									break swtch;
								}
								case 'ProfileBackground': {
									if (user.profile != undefined) {
										delete user.profile;
									}
									break swtch;
								}
								case 'DisplayName': {
									delete user.display_name;
									break swtch;
								}
							}
						}
					}

					for (const [key, value] of Object.entries(event.data)) {
						user[key as keyof User] = value as never;
					}

					return user;
				});

				this.emit('UserUpdate', event);
				break;
			}
			case 'UserRelationship': {
				const user = this.cache.users.get(event.user._id);
				if (user == undefined) {
					this.cache.users.set(event.user._id, createStore(event.user));
				} else {
					const [, setUser] = user;
					setUser(event.user);
				}

				this.emit('UserRelationship', event);
				break;
			}
			case 'UserPresence': {
				const user = this.cache.users.get(event.id);
				if (user == undefined) {
					return;
				}

				const [, setUser] = user;
				setUser((user) => ({ ...user, online: event.online }));
				this.emit('UserPresence', event);
				break;
			}
			case 'UserPlatformWipe': {
				const user = this.cache.users.get(event.user_id);
				if (user == undefined) {
					return;
				}

				const [, setUser] = user;
				setUser((user) => ({ ...user, flags: event.flags }));
				this.emit('UserPlatformWipe', event);
				break;
			}
			case 'EmojiCreate': {
				this.cache.emojis.set(event._id, createStore(event));
				this.emit('EmojiCreate', event);
				break;
			}
			case 'EmojiDelete': {
				if (this.cache.emojis.delete(event.id)) {
					this.emit('EmojiDelete', event);
				}
				break;
			}
			case 'Message': {
				if (this.user == undefined) {
					this.emit('Message', event);
					return;
				}

				const unread = this.unreads().get(event.channel);

				this.unreads().set(event.channel, {
					_id: {
						channel: event.channel,
						user: this.user()._id
					},
					last_id: unread?.last_id ?? event._id,
					mentions:
						unread == undefined || event.mentions == undefined
							? event.mentions
							: unread.mentions?.concat(event.mentions)
				});

				this.emit('Message', event);
				break;
			}
			case 'Auth':
			case 'UserSettingsUpdate':
			case 'ServerMemberJoin':
			case 'ServerMemberLeave':
			case 'MessageUpdate':
			case 'MessageAppend':
			case 'MessageDelete':
			case 'MessageReact':
			case 'MessageUnreact':
			case 'MessageRemoveReaction':
			case 'BulkMessageDelete':
			case 'ChannelStartTyping':
			case 'ChannelStopTyping':
			case 'ChannelAck':
				this.emit(event.type, event as never);
				break;
		}
	}

	async login(data: DataLogin): Promise<ResponseLogin> {
		return this.api
			.post('/auth/session/login', JSON.stringify(data))
			.then((response) => response.json());
	}

	logout(): Promise<Response> {
		return this.api.post('/auth/session/logout');
	}

	revokeSession(id: string): Promise<Response> {
		return this.api.delete(`/auth/session/${id}`);
	}

	revokeAllSessions(revoke_self: boolean): Promise<Response> {
		return this.api.delete(`/auth/session/all?revoke_self=${revoke_self}`);
	}

	async createServer(body: DataCreateServer): Promise<CreateServerResponse> {
		return this.api
			.post('/servers/create', JSON.stringify(body))
			.then((response) => response.json());
	}

	async changeUsername(username: string, password: string): Promise<User> {
		return this.api
			.patch('/users/@me/username', JSON.stringify({ username, password }))
			.then((response) => response.json());
	}

	async openDM(id: string): Promise<Extract<Channel, { channel_type: 'DirectMessage' }>> {
		return this.api.get(`/users/${id}/dm`).then((response) => response.json());
	}

	async joinCall(channel_id: string): Promise<string> {
		return this.api
			.post(`/channels/${channel_id}/join_call`)
			.then((response) => response.json())
			.then(({ token }) => token);
	}

	async acceptFriend(id: string): Promise<User> {
		return this.api.put(`/channels/${id}/friend`).then((response) => response.json());
	}

	async removeFriend(id: string): Promise<User> {
		return this.api.delete(`/users/${id}/friend`).then((response) => response.json());
	}

	async editServer(id: string, data: DataEditServer): Promise<Server> {
		return this.api
			.patch(`/servers/${id}`, JSON.stringify(data))
			.then((response) => response.json());
	}

	async fetchChannel(id: string): Promise<MapValue<Cache['channels']>> {
		const channel = this.cache.channels.get(id);

		if (channel == undefined) {
			const result = createStore(
				await this.api.get(`/channels/${id}`).then((response) => response.json())
			);

			this.cache.channels.set(id, result);
			return result;
		}

		return channel;
	}

	async fetchDirectMessages(): Promise<
		Exclude<Channel, { channel_type: 'TextChannel' | 'VoiceChannel' }>[]
	> {
		return this.api.get('/users/dms').then((response) => response.json());
	}

	ackMessage(channel_id: string, message_id: string): Promise<Response> {
		return this.api.put(`/channels/${channel_id}/ack/${message_id}`);
	}

	async fetchSettings<K extends string>(
		keys: K[]
	): Promise<Record<K, [number, string] | undefined>> {
		return this.api
			.post('/sync/settings/fetch', JSON.stringify({ keys }))
			.then((response) => response.json());
	}

	async fetchUnreads(): Promise<ChannelUnread[]> {
		return this.api.get('/sync/unreads').then((response) => response.json());
	}

	async setSettings(
		settings: Record<string, string | boolean | number | object>,
		timestamp = Date.now()
	): Promise<void> {
		for (const [key, value] of Object.entries(settings)) {
			settings[key] = typeof value == 'string' ? value : JSON.stringify(value);
		}

		await this.api.post(`/sync/settings/set?timestamp=${timestamp}`, JSON.stringify(settings));
	}

	async fetchMembers(server_id: string, exclude_offline = false): Promise<AllMemberResponseMap> {
		return await this.api
			.get(`/servers/${server_id}/members?exclude_offline=${exclude_offline}`)
			.then((response) => response.json())
			.then((response: AllMemberResponse) => {
				const users = mapById<User['_id'], User>(response.users);

				return {
					members:
						response.members.length < 10_000
							? response.members
							: response.members.filter((member) => users.get(member._id.user)?.online),
					users
				};
			});
	}

	async fetchMessage(channel_id: string, message_id: string): Promise<Message> {
		return this.api
			.get(`/channels/${channel_id}/messages/${message_id}`)
			.then((response) => response.json());
	}

	async queryMessages(
		channel_id: string,
		data_query_messages: OptionsQueryMessages
	): Promise<BulkMessageResponse> {
		const params =
			'?' +
			new URLSearchParams(
				Object.entries(data_query_messages).flatMap(([key, value]) =>
					value == undefined ? [] : [[key, value.toString()]]
				)
			);
		return this.api
			.get(`/channels/${channel_id}/messages${params}`)
			.then((response) => response.json());
	}

	async sendMessage(channel_id: string, data_message_send: DataMessageSend): Promise<Message> {
		return this.api
			.post(`/channels/${channel_id}/messages`, JSON.stringify(data_message_send))
			.then((response) => response.json());
	}

	async editMessage(
		channel_id: string,
		message_id: string,
		data_edit_message: DataEditMessage
	): Promise<Message> {
		return this.api
			.patch(`/channels/${channel_id}/messages/${message_id}`, JSON.stringify(data_edit_message))
			.then((response) => response.json());
	}

	deleteMessage(channel_id: string, message_id: string): Promise<Response> {
		return this.api.delete(`/channels/${channel_id}/messages/${message_id}`);
	}

	async fetchServer(id: string): Promise<MapValue<Cache['servers']>> {
		const server = this.cache.servers.get(id);

		if (server == undefined) {
			const result = createStore(
				await this.api.get(`/servers/${id}`).then((response) => response.json())
			);

			this.cache.servers.set(id, result);
			return result;
		}

		return server;
	}

	async fetchSessions(): Promise<SessionInfo[]> {
		return this.api.get('/auth/session/all').then((response) => response.json());
	}

	async fetchUser(id: string): Promise<MapValue<Cache['users']>> {
		const user = this.cache.users.get(id);

		if (user == undefined) {
			const result = createStore(
				await this.api.get(`/users/${id}`).then((response) => response.json())
			);

			this.cache.users.set(id, result);
			return result;
		}

		return user;
	}

	async fetchUserProfile(id: string): Promise<UserProfile> {
		return this.api.get(`/users/${id}/profile`).then((response) => response.json());
	}
}
