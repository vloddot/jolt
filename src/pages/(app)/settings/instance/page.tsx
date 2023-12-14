import utilStyles from '@lib/util.module.scss';
import InputSetting from '../GenericSetting/InputSetting';
import { SettingsContext } from '@lib/context/Settings';
import { createEffect, useContext } from 'solid-js';

export default function SettingsInstance() {
	const { settings, setLocalSettings } = useContext(SettingsContext);
	let instance = settings.instance;

	createEffect(() => {
		instance = settings['instance'];
	});

	return (
		<>
			<h1>Instance Settings</h1>

			<p>When you save, changes won't be applied until you reload.</p>

			<InputSetting
				title="Delta"
				description="Revolt API endpoint"
				value={instance.delta}
				onInput={(event) => (instance.delta = event.currentTarget.value)}
			/>

			<InputSetting
				title="Bonfire"
				description="Revolt WebSocket endpoint"
				value={instance.bonfire}
				onInput={(event) => (instance.bonfire = event.currentTarget.value)}
			/>

			<InputSetting
				title="Autumn"
				description="File attachment service endpoint"
				value={instance.autumn}
				onInput={(event) => (instance.autumn = event.currentTarget.value)}
			/>

			<InputSetting
				title="Emotes"
				description="Webserver hosting default emote assets"
				value={instance.emotes}
				onInput={(event) => (instance.emotes = event.currentTarget.value)}
			/>

			<InputSetting
				title="Legacy Custom Emotes"
				description="Webserver hosting legacy custom emote assets"
				value={instance.legacyEmotes}
				onInput={(event) => (instance.legacyEmotes = event.currentTarget.value)}
			/>

			<button
				class={utilStyles.buttonPrimary}
				style={{ 'max-width': 'max-content', 'margin-top': '8px' }}
				onClick={() => setLocalSettings('instance', instance)}
			>
				Save
			</button>
		</>
	);
}
