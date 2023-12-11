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
}
