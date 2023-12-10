import styles from './index.module.scss';
import util from '@lib/util';
import { Match, Switch, createMemo } from 'solid-js';
import UserAvatar from '../Avatar';
import RoleColorStyle from '@components/RoleColorStyle';

export interface Props {
	user: User;
	member?: Member;
	message?: Message;
	showPresence?: boolean;
	width?: string;
	height?: string;
}

export default function UserButton(props: Props) {
	const displayName = createMemo(() =>
		util.getDisplayName(props.user, props.member, props.message)
	);

	return (
		<div class={styles.userButton}>
			<UserAvatar {...props} />

			<div class={styles.userDetail}>
				<RoleColorStyle member={props.member}>{displayName()}</RoleColorStyle>

				<span class={styles.userPresence}>
					<Switch fallback="Online">
						<Match keyed when={!props.user.online || props.user.status?.presence == 'Invisible'}>
							Offline
						</Match>
						<Match keyed when={props.user.status?.text}>
							{(text) => text}
						</Match>
						<Match keyed when={props.user.status?.presence == 'Busy'}>
							Do Not Disturb
						</Match>
						<Match keyed when={props.user.status?.presence}>
							{(presence) => presence}
						</Match>
					</Switch>
				</span>
			</div>
		</div>
	);
}
