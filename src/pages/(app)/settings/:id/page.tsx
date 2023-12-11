import { Show } from 'solid-js';
import type { Component } from 'solid-js';
import SettingsAppearance from '../appearance/page';
import { Dynamic } from 'solid-js/web';
import { useParams } from '@solidjs/router';
import SettingsBehavior from '../behavior/page';

const sectionMapping: Record<string, Component> = {
	appearance: SettingsAppearance,
	behavior: SettingsBehavior
};

export default function SettingsSection() {
	const params = useParams();

	const section = () => sectionMapping[params.id];

	return (
		<Show when={section()} fallback={<p>This settings section does not exist.</p>}>
			{(section) => <Dynamic component={section()} />}
		</Show>
	);
}
