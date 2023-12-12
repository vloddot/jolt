import CheckboxSetting from '@components/CheckboxSetting';
import { SettingsContext } from '@lib/context/Settings';
import { useContext } from 'solid-js';

export default function SettingsAppearance() {
	const [settings, setSettings] = useContext(SettingsContext);

	return (
		<>
			<h1>Show Presence Icons</h1>
			<CheckboxSetting
				title="Members List"
				description="Show presence icons in members list"
				checked={settings['appearance:presence-icons']['members-list']}
				onInput={(event) =>
					setSettings('appearance:presence-icons', 'members-list', event.currentTarget.checked)
				}
			/>

			<CheckboxSetting
				title="Messages"
				description="Show presence icons in messages"
				checked={settings['appearance:presence-icons']['messages']}
				onInput={(event) =>
					setSettings('appearance:presence-icons', 'messages', event.currentTarget.checked)
				}
			/>

			<CheckboxSetting
				title="Replies"
				description="Show presence icons in replies"
				checked={settings['appearance:presence-icons']['replies']}
				onInput={(event) =>
					setSettings('appearance:presence-icons', 'replies', event.currentTarget.checked)
				}
			/>

			<CheckboxSetting
				title="Reply bar"
				description="Show presence icons in reply bar"
				checked={settings['appearance:presence-icons']['reply-bar']}
				onInput={(event) =>
					setSettings('appearance:presence-icons', 'reply-bar', event.currentTarget.checked)
				}
			/>

			<CheckboxSetting
				title="Direct Messages"
				description="Show presence icons in Direct Messages"
				checked={settings['appearance:presence-icons']['dms']}
				onInput={(event) =>
					setSettings('appearance:presence-icons', 'dms', event.currentTarget.checked)
				}
			/>

			<CheckboxSetting
				title="Show role colors"
				description="Show colors for roles inside a server"
				checked={settings['appearance:show-role-colors']}
				onInput={(event) => {
					setSettings('appearance:show-role-colors', event.currentTarget.checked);
				}}
			/>
		</>
	);
}
