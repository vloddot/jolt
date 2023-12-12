import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import UserButton from '@components/User/Button';
import { For, Match, Show, Switch } from 'solid-js';
import { CgUserAdd, CgUserRemove } from 'solid-icons/cg';
import api from '@lib/api';
import Tooltip from '@components/Tooltip';

export interface Props {
	title: string;
	list: User[];
}

export default function FriendsListCategory(props: Props) {
	return (
		<Show when={props.list.length != 0}>
			<details open>
				<summary>
					{props.title} &mdash; {props.list.length}
				</summary>
				<For each={props.list}>
					{(user) => {
						return (
							<div
								class={styles.friendsListCategoryItem}
								style={{
									'--initial-background':
										user.relationship == 'Incoming' ? 'var(--tertiary-background)' : 'transparent'
								}}
							>
								<div class={utilStyles.flexDivider}>
									<UserButton user={user} showPresence />
								</div>

								<Show when={user.relationship == 'Incoming'}>
									<Tooltip content="Accept Friend Request">
										<button class={styles.roundButton} style={{ '--hover': 'var(--success)' }}>
											<CgUserAdd size="16" />
										</button>
									</Tooltip>
								</Show>
								<Switch>
									<Match when={user.relationship == 'Friend' || user.relationship == 'Incoming'}>
										<Tooltip
											content={
												user.relationship == 'Friend' ? 'Remove Friend' : 'Deny Friend Request'
											}
										>
											<button
												class={styles.roundButton}
												style={{ '--hover': 'var(--error)' }}
												onClick={() => api.removeFriend(user._id)}
											>
												<CgUserRemove size="16" />
											</button>
										</Tooltip>
									</Match>
								</Switch>
							</div>
						);
					}}
				</For>
			</details>
		</Show>
	);
}
