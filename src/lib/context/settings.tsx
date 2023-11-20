import { createContext, type JSX, batch, useContext, createSignal } from 'solid-js';
import api from '@lib/api';
import { SessionContext } from './session';
import localforage from 'localforage';
import ClientContext from './client';

export const DEFAULT_SETTINGS: Settings = {
	ordering: {
		servers: [
			'01HC4Y9963EZBZD40W28V0SWD2',
			'01H8N45SQAG0TX5CG2D73SCC9N',
			'01FEPATGXB3TGTKSA3ZVA7RSTM',
			'01G9MG1FVJZ48EEF92AWAYECDQ',
			'01GE57Z6R7FQ87W7FZ2WVVKN14',
			'01HE3S21QXPKSKT4PR8NPFFEMX',
			'01H6WQGNWVEKH3BH7FS14NS7XH',
			'01H14M0JCRWT52VW7BR1XH5Y5W',
			'01H9TY25TCFQEEVZ51H6759RFC',
			'01FZ62C8WFS3HBEN5QTN8RZRQG',
			'01HDKZ68636VGY26R3BYWTWZE1',
			'01H772FY0XWAKQ97AT7KK84YGK',
			'01H3WR1DEFNFM2MD415S7JCBZ0',
			'01HDPXKN5BQDGHS2D4PW9S3AZ1'
		]
	}
};

export const SettingsContext = createContext(() => DEFAULT_SETTINGS);

interface Props {
	children: JSX.Element;
}

export default function SettingsProvider(props: Props) {
	const client = useContext(ClientContext);
	const [settings, setSettings] = createSignal(SettingsContext.defaultValue());
	const [session] = useContext(SessionContext);

	client.on('Ready', () => {
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
	});

	client.on('UserSettingsUpdate', ({ id, update }) => {
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
	});

	return <SettingsContext.Provider value={settings}>{props.children}</SettingsContext.Provider>;
}
