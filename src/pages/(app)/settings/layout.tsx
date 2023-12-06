import ChannelItem from '@components/ChannelItem';
import { For, createSelector } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import settingsSections from './sections';
import { Outlet, useParams } from '@solidjs/router';

export default function SettingsWrapper() {
	const params = useParams();
	const isSelected = createSelector(() => params.id);

	return (
		<>
			<div class="channel-bar-container">
				<For each={Object.values(settingsSections)}>
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
