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
	}
};

export const SettingsContext = createContext<CollectionItem<Settings>>(
	// eslint-disable-next-line solid/reactivity
	createStore(DEFAULT_SETTINGS)
);

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
					setSettings((settings) => ({ ...settings, [key]: valueParsed }));
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
			const revisionKey = `revision:${key}`;

			localforage.setItem(key, unwrap(settings[key]));
			localforage.setItem(revisionKey, Date.now());

			api.setSettings();
		}
	}

	return (
		<SettingsContext.Provider value={[settings, updateSettings as SetStoreFunction<Settings>]}>
			{props.children}
		</SettingsContext.Provider>
	);
}
