import styles from './index.module.scss';
import GenericSetting from '../../GenericSetting';
import { For, Show, createMemo, createSelector, useContext } from 'solid-js';
import { UserContext } from '@lib/context/User';
import UserAvatar from '@components/User/Avatar';
import Tooltip from '@components/Tooltip';
import api from '@lib/api';

const presenceIndicators: Presence[] = ['Online', 'Idle', 'Focus', 'Busy', 'Invisible'];

export default function UserProfileSettings() {
	const user = useContext(UserContext);

	return (
		<Show when={user()}>
			{(user) => {
				const presenceSelected = createSelector(() => user().status?.presence ?? 'Online');
				const description = createMemo(() => {
					switch (user().status?.presence) {
						case undefined:
						case 'Online':
							return 'The default status. You get notification sounds from DMs, servers and channels you marked to get all message notifications from and mentions.';
						case 'Idle':
							return 'Idling about. Same as online in terms of notifications, you get notification sounds from DMs, servers and channels you marked to get all message notifications from and mentions.';
						case 'Focus':
							return 'Perfect for focusing on something when you also want to be available. You get notification sounds from mentions only.';
						case 'Busy':
							return "Just a busy person. You don't get any notifications.";
						case 'Invisible':
							return 'Does not want to show his status to the public. Same as online in terms of notifications, you get notification sounds from DMs, servers and channels you marked to get all message notifications from and mentions.';
					}
				});

				return (
					<>
						<GenericSetting title="Presence" description="Presence indicator" cursor="default">
							<div class={styles.presenceIndicators}>
								<For each={Object.values(presenceIndicators)}>
									{(presence) => {
										return (
											<Tooltip content={presence == 'Busy' ? 'Do Not Disturb' : presence}>
												<button
													class={styles.presenceIndicator}
													data-selected={presenceSelected(presence)}
													onClick={() => api.editUser(user()._id, { status: { presence } })}
												>
													<UserAvatar
														user={{
															...user(),
															status: { ...user().status, presence }
														}}
													/>
												</button>
											</Tooltip>
										);
									}}
								</For>
							</div>
						</GenericSetting>
						<p>{description()}</p>
					</>
				);
			}}
		</Show>
	);
}
