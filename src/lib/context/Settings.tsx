import {
	createContext,
	type JSX,
	batch,
	useContext,
	onMount,
	onCleanup,
	createEffect,
	on
} from 'solid-js';
import api from '@lib/api';
import { SessionContext } from './Session';
import localforage from 'localforage';
import ClientContext from './Client';
import type { ClientEvents } from '@lib/Client';
import { createStore, unwrap, type SetStoreFunction } from 'solid-js/store';

export const DEFAULT_SETTINGS: Settings = {
	ordering: {},
	'appearance:presence-icons': {
		dms: true,
		'members-list': true,
		messages: true,
		replies: true,
		'reply-bar': true
	},
	'appearance:show-role-colors': true,
	'behavior:typing-indicators': {
		send: true,
		receive: true
	},
	'behavior:reply-mention': true,
	instance: {
		delta: 'https://api.revolt.chat',
		bonfire: 'wss://ws.revolt.chat',
		autumn: 'https://autumn.revolt.chat',
		emotes: 'https://static.revolt.chat/emoji/twemoji',
		legacyEmotes: 'https://dl.insrt.uk'
	},
	'appearance:theme:overrides': {
		accent: '#3399ff',
		background: '#141414',
		foreground: '#dddddd',
		block: '#2d2d2d',
		'primary-background': '#202020',
		'primary-header': '#323232',
		'secondary-background': '#1a1a1a',
		'secondary-foreground': '#aaaaaa',
		'secondary-header': '#262626',
		'message-box': '#2d2d2d',
		mention: '#3399ff30',
		'tertiary-background': '#3d3d3d',
		'tertiary-foreground': '#666666',
		'status-online': '#12ca74',
		'status-idle': '#f1b040',
		'status-focus': '#4799f0',
		'status-busy': '#f53d42',
		'status-invisible': '#80848e',
		success: '#0ea55e',
		hover: 'rgba(255, 255, 255, 0.075)',
		selected: 'rgba(255, 255, 255, 0.15)',
		'scrollbar-track': 'transparent',
		'scrollbar-thumb': '#2469b2',
		error: '#d2373d',
		'scrollbar-thickness': '5px'
	}
};

const [defaultSettings, setDefaultSettings] = createStore(DEFAULT_SETTINGS);

function setLocalSettings(key: string, value: Settings[keyof Settings]) {
	localforage.setItem(key, value);
	localforage.setItem(`revision:${key}`, Date.now());

	api.setSettings();
}

export const SettingsContext = createContext<{
	settings: Settings;
	setSettings: SetStoreFunction<Settings>;
	setLocalSettings: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}>({
	settings: defaultSettings,
	setSettings: setDefaultSettings,
	setLocalSettings
});

export interface Props {
	children: JSX.Element;
}

export default function SettingsProvider(props: Props) {
	const client = useContext(ClientContext);
	const [settings, setSettings] = createStore(DEFAULT_SETTINGS);
	const [session] = useContext(SessionContext);

	createEffect(
		on(session, (session) => {
			if (session == undefined) {
				return;
			}

			api.fetchSettings<keyof Settings>(['ordering']).then((settings) => {
				batch(() => {
					for (const [key, [serverRevision, serverValue]] of Object.entries(settings) as [
						keyof Settings,
						[number, string]
					][]) {
						const revisionKey = `revision:${key}`;
						localforage.getItem(revisionKey).then((localRevision) => {
							if (((localRevision as number) ?? 0) < serverRevision) {
								const valueParsed = JSON.parse(serverValue);
								localforage.setItem(revisionKey, serverRevision);
								localforage.setItem(key, valueParsed);
								setSettings(key, valueParsed);
							}

							localforage.getItem(key).then((localValue) => {
								if (localValue == null) {
									setSettings(key, DEFAULT_SETTINGS[key]);
								} else {
									setSettings(key, localValue);
								}
							});
						});
					}
				});
			});
		})
	);

	// effect that updates when the theme overrides proxy object changes...
	createEffect(
		on(
			() => settings['appearance:theme:overrides'],
			(overrides) => {
				// create an effect for every override; when each one changes...
				for (const key of Object.keys(
					overrides
				) as (keyof Settings['appearance:theme:overrides'])[]) {
					createEffect(
						on(
							() => settings['appearance:theme:overrides'][key],
							(value) => {
								// ...set the value
								document.documentElement.style.setProperty(`--${key}`, value);
							}
						)
					);
				}
			}
		)
	);

	onMount(() => {
		const userSettingsUpdateHandler: ClientEvents['UserSettingsUpdate'] = ({ id, update }) => {
			if (id != session()?.user_id) {
				return;
			}

			batch(() => {
				for (const [key, [revision, value]] of Object.entries(update) as [
					keyof Settings,
					[number, string]
				][]) {
					const revisionKey = `revision:${key}`;
					const valueParsed = JSON.parse(value);
					localforage.setItem(revisionKey, revision);
					localforage.setItem(key, valueParsed);
					setSettings(key, valueParsed);
				}
			});
		};

		client.on('UserSettingsUpdate', userSettingsUpdateHandler);

		onCleanup(() => {
			client.removeListener('UserSettingsUpdate', userSettingsUpdateHandler);
		});

		for (const key of Object.keys(settings) as (keyof Settings)[]) {
			localforage.getItem(key).then((value) => {
				if (value != null) {
					setSettings(key, value as Settings[keyof Settings]);
				}
			});
		}
	});

	function updateSettings(...args: unknown[]) {
		(setSettings as (...args: unknown[]) => void)(...args);

		if (typeof args[0] == 'string') {
			const key = args[0] as keyof Settings;
			SettingsContext.defaultValue.setLocalSettings(key, unwrap(settings[key]));
		}
	}

	return (
		<SettingsContext.Provider
			value={{
				settings,
				setSettings: updateSettings as SetStoreFunction<Settings>,
				setLocalSettings: SettingsContext.defaultValue.setLocalSettings
			}}
		>
			{props.children}
		</SettingsContext.Provider>
	);
}
