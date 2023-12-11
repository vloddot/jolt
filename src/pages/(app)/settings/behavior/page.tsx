import CheckboxSetting from '@components/Settings/CheckboxSetting';
import { SettingsContext } from '@lib/context/Settings';
import { useContext } from 'solid-js';

export default function SettingsBehavior() {
	const [settings, setSettings] = useContext(SettingsContext);

	return (
		<>
			<h1>Typing Indicators</h1>

			<CheckboxSetting
				title="Send Typing Indicators"
				description="Send typing indicators in channels to other users."
				checked={settings['behavior:typing-indicators'].send}
				onInput={(event) =>
					setSettings('behavior:typing-indicators', 'send', event.currentTarget.checked)
				}
			/>

			<CheckboxSetting
				title="Receive Typing Indicators"
				description="Receive typing indicators in channels from other users."
				checked={settings['behavior:typing-indicators'].receive}
				onInput={(event) =>
					setSettings('behavior:typing-indicators', 'receive', event.currentTarget.checked)
				}
			/>
		</>
	);
}
