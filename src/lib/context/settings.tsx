import {
	createContext,
	type JSX,
	batch,
	useContext,
	createSignal,
	onMount,
	onCleanup
} from 'solid-js';
import api from '@lib/api';
import { SessionContext } from './session';
import localforage from 'localforage';
import ClientContext from './client';
import type { ClientEvents } from '@lib/client';

export const DEFAULT_SETTINGS: Settings = {
	ordering: {}
};

export const SettingsContext = createContext(() => DEFAULT_SETTINGS);

interface Props {
	children: JSX.Element;
}

export default function SettingsProvider(props: Props) {
	const client = useContext(ClientContext);
	const [settings, setSettings] = createSignal(SettingsContext.defaultValue());
	const [session] = useContext(SessionContext);

	onMount(() => {
		const readyHandler: ClientEvents['Ready'] = () => {
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
								setSettings((settings) => ({ ...settings, [key]: valueParsed }));
							}

							localforage.getItem(key).then((localValue) => {
								if (localValue == null) {
									setSettings((settings) => ({ ...settings, [key]: DEFAULT_SETTINGS[key] }));
								} else {
									setSettings((settings) => ({ ...settings, [key]: localValue }));
								}
							});
						});
					}
				});
			});
		};

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

		client.on('Ready', readyHandler);
		client.on('UserSettingsUpdate', userSettingsUpdateHandler);

		onCleanup(() => {
			client.removeListener('Ready', readyHandler);
			client.removeListener('UserSettingsUpdate', userSettingsUpdateHandler);
		});
	});

	return <SettingsContext.Provider value={settings}>{props.children}</SettingsContext.Provider>;
}
