interface Settings {
	ordering: {
		servers?: string[];
	};
	'appearance:presence-icons': {
		'members-list': boolean;
		messages: boolean;
		replies: boolean;
		'reply-bar': boolean;
		dms: boolean;
	};
	'appearance:show-role-colors': boolean;
	'behavior:typing-indicators': {
		send: boolean;
		receive: boolean;
	};
	'behavior:reply-mention': boolean;
	instance: {
		delta: string;
		bonfire: string;
		autumn: string;
		emotes: string;
		legacyEmotes: string;
	};
	'appearance:theme:overrides': Record<
		| 'accent'
		| 'background'
		| 'foreground'
		| 'block'
		| 'primary-background'
		| 'primary-header'
		| 'secondary-background'
		| 'secondary-foreground'
		| 'secondary-header'
		| 'message-box'
		| 'mention'
		| 'tertiary-background'
		| 'tertiary-foreground'
		| 'status-online'
		| 'status-idle'
		| 'status-focus'
		| 'status-busy'
		| 'status-invisible'
		| 'success'
		| 'error'
		| 'hover'
		| 'selected'
		| 'scrollbar-track'
		| 'scrollbar-thumb'
		| 'scrollbar-thickness',
		string
	>;
	'appearance:theme:css': string;
}

interface SettingsSection {
	title: string;
	id: string;
	icon: import('solid-icons').IconTypes;
}
