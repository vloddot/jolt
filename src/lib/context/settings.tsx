import { createContext, type JSX, batch, useContext, onMount } from 'solid-js';
import api from '@lib/api';
import { createStore } from 'solid-js/store';
import { SessionContext } from './session';
import localforage from 'localforage';

export const DEFAULT_SETTINGS: Settings = {
	ordering: { servers: [] }
};

export const SettingsContext = createContext(DEFAULT_SETTINGS);

interface Props {
	children: JSX.Element;
}

export default function SettingsProvider(props: Props) {
	const [settings, setSettings] = createStore(SettingsContext.defaultValue);
	const [session] = useContext(SessionContext);

	onMount(() => {
		if (session() == undefined) {
			return;
		}

		api.fetchSettings<keyof Settings>(['ordering']).then((settings) => {
			batch(async () => {
				for (const [key, [serverRevision, serverValue]] of Object.entries(settings) as [
					keyof Settings,
					[number, string]
				][]) {
					const revisionKey = `revision:${key}`;
					const localRevision = Number((await localforage.getItem(revisionKey)) ?? '0');

					if (localRevision < serverRevision) {
						localforage.setItem(revisionKey, serverRevision.toString());
						localforage.setItem(key, serverValue);
						setSettings(key, JSON.parse(serverValue));
					}

					const localValue: Settings[keyof Settings] | null = await localforage.getItem(key);
					if (localValue == null) {
						setSettings(key, DEFAULT_SETTINGS[key]);
					} else {
						setSettings(key, localValue);
					}
				}
			});
		});
	});

	return <SettingsContext.Provider value={settings}>{props.children}</SettingsContext.Provider>;
}
