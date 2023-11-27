import { EventEmitter } from 'eventemitter3';
import { createSignal, type Accessor, type Setter } from 'solid-js';

const PING_HEARTBEAT_INTERVAL = 30;
const PONG_TIMEOUT = 10;

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
	| { type: 'NotFound' }
	| {
			type: 'Ready';
			users: User[];
			servers: Server[];
			channels: Channel[];
			members: Member[];
			emojis: Emoji[];
	  }
	| { type: 'Ping'; data: number }
	| { type: 'Pong'; data: number }
	| ({ type: 'Message' } & Message)
	| {
			type: 'MessageUpdate';
			id: string;
			channel: string;
			data: Partial<Message>;
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
 * Websocket error packet
 */
export type WebSocketError = {
	error: 'InternalError' | 'InvalidSession' | 'OnboardingNotFinished' | 'AlreadyAuthenticated';
};

export type ConnectionState = 'idle' | 'disconnected' | 'connecting' | 'connected';

export type ToEvents<T extends { type: string }> = {
	[K in Exclude<T['type'], 'Bulk'>]: (message: Extract<T, { type: K }>) => void;
};

export type ClientEvents = {
	Error(
		error: 'InternalError' | 'InvalidSession' | 'OnboardingNotFinished' | 'AlreadyAuthenticated'
	): void;
} & ToEvents<ServerToClientMessage>;

export class Client extends EventEmitter<ClientEvents> {
	#socket: WebSocket | undefined;
	#pingIntervalReference: NodeJS.Timeout | undefined;
	#pongTimeoutReference: NodeJS.Timeout | undefined;
	#connectionState: Accessor<ConnectionState>;
	#setConnectionState: Setter<ConnectionState>;

	constructor() {
		super();
		const [state, setState] = createSignal<ConnectionState>('idle');
		[this.#connectionState, this.#setConnectionState] = [state, setState];
	}

	get connectionState(): Accessor<ConnectionState> {
		return this.#connectionState;
	}

	authenticate(token: string) {
		this.#socket = new WebSocket(`wss://ws.revolt.chat?token=${token}`);
		this.#setConnectionState('connecting');

		this.#socket.onopen = () => {
			this.#pingIntervalReference = setInterval(() => {
				this.send({ type: 'Ping', data: Date.now() });
				this.#pongTimeoutReference = setTimeout(() => this.disconnect(), PONG_TIMEOUT * 1000);
			}, PING_HEARTBEAT_INTERVAL * 1000);
		};
		this.#socket.onmessage = (message) => this.handleMessage(JSON.parse(message.data.toString()));
		this.#socket.onclose = () => this.disconnect();
	}

	handleMessage(message: ServerToClientMessage): void {
		switch (message.type) {
			case 'Ping': {
				this.send({
					type: 'Pong',
					data: message.data
				});
				this.emit('Ping', message);
				return;
			}
			case 'Pong': {
				clearTimeout(this.#pongTimeoutReference);
				this.emit('Pong', message);
				return;
			}
			case 'NotFound': {
				// localforage.removeItem('session');

				this.emit('NotFound', message);
				return;
			}
			case 'Error': {
				this.disconnect();
				this.emit('Error', message as never);
				return;
			}
		}

		const state = this.#connectionState();
		if (state == 'connecting') {
			if (message.type == 'Ready') {
				this.#setConnectionState('connected');
				this.emit('Ready', message);
				return;
			}
		}

		if (
			(state != 'connected' && message.type != 'Authenticated') ||
			(state == 'connected' && (message.type == 'Authenticated' || message.type == 'Ready'))
		) {
			throw new Error(`Received ${message.type} in ${state} state.`);
		}

		if (message.type == 'Bulk') {
			for (const e of message.v) {
				this.handleMessage(e);
			}
			return;
		}

		this.emit(message.type, message as never);
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

		this.#socket.close();
		this.#socket = undefined;

		this.#setConnectionState('disconnected');
	}
}
