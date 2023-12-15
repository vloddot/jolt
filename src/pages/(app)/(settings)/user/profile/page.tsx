import styles from './index.module.scss';
import GenericSetting from '../../GenericSetting';
import { For, Show, createSelector, useContext } from 'solid-js';
import { UserContext } from '@lib/context/User';
import UserAvatar from '@components/User/Avatar';
import Tooltip from '@components/Tooltip';
import api from '@lib/api';

interface PresenceIndicator {
	type: Presence;
}

const presenceIndicators: Record<Presence, PresenceIndicator> = {
	Online: {
		type: 'Online'
	},
	Focus: {
		type: 'Focus'
	},
	Idle: {
		type: 'Idle'
	},
	Busy: {
		type: 'Busy'
	},
	Invisible: {
		type: 'Invisible'
	}
};

export default function UserProfileSettings() {
	const user = useContext(UserContext);
	const presenceSelected = createSelector(() => user()?.status?.presence ?? 'Online');

	return (
		<Show when={user()}>
			{(user) => (
				<GenericSetting
					title="Presence"
					description="Presence indicator"
					cursor="default"
					labelStyle={{ 'min-width': '150px' }}
				>
					<div class={styles.presenceIndicators}>
						<For each={Object.values(presenceIndicators)}>
							{(indicator) => {
								return (
									<Tooltip content={indicator.type}>
										<button
											class={styles.presenceIndicator}
											data-selected={presenceSelected(indicator.type)}
											onClick={() =>
												api.editUser(user()._id, { status: { presence: indicator.type } })
											}
										>
											<UserAvatar
												user={{ ...user(), status: { ...user().status, presence: indicator.type } }}
											/>
										</button>
									</Tooltip>
								);
							}}
						</For>
					</div>
				</GenericSetting>
			)}
		</Show>
	);
}
