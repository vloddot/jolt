import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import UserButton from '@components/User/Button';
import { For, Match, Show, Switch } from 'solid-js';
import api from '@lib/api';
import Tooltip from '@components/Tooltip';
import {
	FaSolidUserMinus,
	FaSolidUserPlus,
	FaSolidUserSlash,
	FaSolidUserXmark
} from 'solid-icons/fa';
import type { IconTypes } from 'solid-icons';
import { Dynamic } from 'solid-js/web';

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
										<button
											class={styles.roundButton}
											style={{ '--hover': 'var(--success)' }}
											onClick={() => api.acceptFriend(user._id)}
										>
											<FaSolidUserPlus size="16" />
										</button>
									</Tooltip>
								</Show>
								<Switch>
									<Match
										when={
											user.relationship != undefined &&
											(user.relationship == 'Friend' ||
												user.relationship == 'Incoming' ||
												user.relationship == 'Outgoing') &&
											(user as User & { relationship: 'Friend' | 'Incoming' | 'Outgoing' })
										}
									>
										{(user) => {
											const tooltipContentMapping: Record<
												'Friend' | 'Incoming' | 'Outgoing',
												string
											> = {
												Friend: 'Remove Friend',
												Incoming: 'Deny Friend Request',
												Outgoing: 'Cancel Friend Request'
											};

											const iconMapping: Record<'Friend' | 'Incoming' | 'Outgoing', IconTypes> = {
												Friend: FaSolidUserMinus,
												Incoming: FaSolidUserSlash,
												Outgoing: FaSolidUserXmark
											};

											return (
												<Tooltip content={tooltipContentMapping[user().relationship]}>
													<button
														class={styles.roundButton}
														style={{ '--hover': 'var(--error)' }}
														onClick={() => api.removeFriend(user()._id)}
													>
														<Dynamic component={iconMapping[user().relationship]} size="16" />
													</button>
												</Tooltip>
											);
										}}
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
