import { EventEmitter } from 'eventemitter3';
import { PING_HEARTBEAT_INTERVAL, PONG_TIMEOUT } from './util';

/**
 * Messages sent to the server
 */
export type ClientToServerMessage =
	| { type: 'Authenticate'; token: string }
	| {
			type: 'BeginTyping';
			channel: string;
	  }
	| {
			type: 'EndTyping';
			channel: string;
	  }
	| {
			type: 'Ping';
			data: number;
	  }
	| {
			type: 'Pong';
			data: number;
	  };

/**
 * Messages sent from the server
 */
export type ServerToClientMessage =
	| ({ type: 'Error' } & WebSocketError)
	| { type: 'Bulk'; v: ServerToClientMessage[] }
	| { type: 'Authenticated' }
	| ({ type: 'Ready' } & ReadyData)
	| { type: 'Ping'; data: number }
	| { type: 'Pong'; data: number }
	| ({ type: 'Message' } & Message)
	| {
			type: 'MessageUpdate';
			id: string;
			channel: string;
			data: Partial<ClientToServerMessage>;
	  }
	| {
			type: 'MessageAppend';
			id: string;
			channel: string;
			append: Pick<Partial<Message>, 'embeds'>;
	  }
	| { type: 'MessageDelete'; id: string; channel: string }
	| {
			type: 'MessageReact';
			id: string;
			channel_id: string;
			user_id: string;
			emoji_id: string;
	  }
	| {
			type: 'MessageUnreact';
			id: string;
			channel_id: string;
			user_id: string;
			emoji_id: string;
	  }
	| {
			type: 'MessageRemoveReaction';
			id: string;
			channel_id: string;
			emoji_id: string;
	  }
	| { type: 'BulkMessageDelete'; channel: string; ids: string[] }
	| ({ type: 'ChannelCreate' } & Channel)
	| {
			type: 'ChannelUpdate';
			id: string;
			data: Partial<Channel>;
			clear?: FieldsChannel[];
	  }
	| { type: 'ChannelDelete'; id: string }
	| { type: 'ChannelGroupJoin'; id: string; user: string }
	| { type: 'ChannelGroupLeave'; id: string; user: string }
	| { type: 'ChannelStartTyping'; id: string; user: string }
	| { type: 'ChannelStopTyping'; id: string; user: string }
	| { type: 'ChannelAck'; id: string; user: string; message_id: string }
	| {
			type: 'ServerCreate';
			id: string;
			server: Server;
			channels: Channel[];
	  }
	| {
			type: 'ServerUpdate';
			id: string;
			data: Partial<Server>;
			clear?: FieldsServer[];
	  }
	| { type: 'ServerDelete'; id: string }
	| {
			type: 'ServerMemberUpdate';
			id: MemberCompositeKey;
			data: Partial<Member>;
			clear?: FieldsMember[];
	  }
	| { type: 'ServerMemberJoin'; id: string; user: string }
	| { type: 'ServerMemberLeave'; id: string; user: string }
	| {
			type: 'ServerRoleUpdate';
			id: string;
			role_id: string;
			data: Partial<Role>;
	  }
	| { type: 'ServerRoleDelete'; id: string; role_id: string }
	| {
			type: 'UserUpdate';
			id: string;
			data: Partial<User>;
			clear?: FieldsUser[];
	  }
	| { type: 'UserRelationship'; user: User; status: RelationshipStatus }
	| { type: 'UserPresence'; id: string; online: boolean }
	| {
			type: 'UserSettingsUpdate';
			id: string;
			update: { [key: string]: [number, string] };
	  }
	| { type: 'UserPlatformWipe'; user_id: string; flags: number }
	| ({ type: 'EmojiCreate' } & Emoji)
	| { type: 'EmojiDelete'; id: string }
	| ({
			type: 'Auth';
	  } & (
			| {
					event_type: 'DeleteSession';
					user_id: string;
					session_id: string;
			  }
			| {
					event_type: 'DeleteAllSessions';
					user_id: string;
					exclude_session_id: string;
			  }
	  ));

/**
 * Initial synchronisation packet
 */
export type ReadyData = {
	users: User[];
	servers: Server[];
	channels: Channel[];
	members: Member[];
	emojis: Emoji[];
};

/**
 * Websocket error packet
 */
export type WebSocketError = {
	error: 'InternalError' | 'InvalidSession' | 'OnboardingNotFinished' | 'AlreadyAuthenticated';
};

export type ConnectionState = 'idle' | 'disconnected' | 'connecting' | 'connected';

export class WebSocketClient extends EventEmitter<{
	error: (error: Error) => void;
	connectionStateChange: (state: ConnectionState) => void;
	serverEvent: (event: ServerToClientMessage) => void;
}> {
	#socket: WebSocket | undefined;
	#pingIntervalReference: NodeJS.Timeout | undefined;
	#pongTimeoutReference: NodeJS.Timeout | undefined;
	#connectionState: ConnectionState = 'idle';

	get connectionState() {
		return this.#connectionState;
	}

	constructor() {
		super();
	}

	authenticate(token: string) {
		this.#socket = new WebSocket(`wss://ws.revolt.chat?token=${token}`);

		this.#connectionState = 'connecting';

		this.#socket.onopen = () => {
			this.#pingIntervalReference = setInterval(() => {
				this.send({ type: 'Ping', data: Date.now() });
				this.#pongTimeoutReference = setTimeout(() => this.disconnect(), PONG_TIMEOUT * 1000);
			}, PING_HEARTBEAT_INTERVAL * 1000);
		};

		this.#socket.onmessage = (event) => this.handleMessage(JSON.parse(event.data.toString()));
		this.#socket.onclose = () => this.disconnect();
	}

	handleMessage(message: ServerToClientMessage): void {
		switch (message.type) {
			case 'Ping':
				this.send({
					type: 'Pong',
					data: message.data
				});
				return;
			case 'Pong':
				clearTimeout(this.#pongTimeoutReference);
				return;
			case 'Error':
				this.emit('error', message as never);
				this.disconnect();
				return;
		}

		switch (this.connectionState) {
			case 'connecting':
				if (message.type == 'Ready') {
					this.emit('serverEvent', message);
					this.#connectionState = 'connected';
				} else if (message.type != 'Authenticated') {
					throw new Error(`Received ${message.type} in connecting state.`);
				}
				break;
			case 'connected':
				if (message.type == 'Authenticated' || message.type == 'Ready') {
					throw new Error(`Received ${message.type} in connected state.`);
				}

				this.emit('serverEvent', message);
				break;
			default:
				throw new Error(`Received ${message.type} in ${this.connectionState} state.`);
		}
	}

	send(message: ClientToServerMessage) {
		if (!this.#socket) {
			throw new Error('Tried to send WS message when the connection was disconnected.');
		}

		this.#socket.send(JSON.stringify(message));
	}

	disconnect() {
		if (!this.#socket) {
			return;
		}

		clearInterval(this.#pingIntervalReference);

		const websocket = this.#socket;
		this.#socket = undefined;
		websocket.close();

		this.#connectionState = 'disconnected';
	}
}
