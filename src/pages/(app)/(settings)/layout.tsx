import ChannelItem from '@components/ChannelItem';
import { For, createMemo, createSelector } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import settingsSections from './settings/sections';
import { Outlet, useLocation } from '@solidjs/router';
import userSettingsSections from './user/sections';

const typeMapping: Record<string, SettingsSection[]> = {
	user: userSettingsSections,
	settings: settingsSections
};

export default function SettingsWrapper() {
	const location = useLocation();
	const params = createMemo(() => {
		const split = location.pathname.split('/');

		return { type: split[1], id: split[2] };
	});

	const isSelected = createSelector(() => params().id);

	return (
		<>
			<div class="channel-bar-container">
				<For each={Object.values(typeMapping[params().type])}>
					{(section) => (
						<ChannelItem
							href={`/settings/${section.id}`}
							unread={false}
							selected={isSelected(section.id)}
						>
							<Dynamic component={section.icon} />
							{section.title}
						</ChannelItem>
					)}
				</For>
			</div>

			<main class="main-content-container" style={{ padding: '16px' }}>
				<Outlet />
			</main>
		</>
	);
}
