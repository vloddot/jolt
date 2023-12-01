import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import util from '@lib/util';
import { Match, Switch, createMemo } from 'solid-js';

export interface Props {
	user: User;
	member?: Member;
}

export default function UserButton(props: Props) {
	const displayName = createMemo(() => util.getDisplayName(props.user, props.member));
	const displayAvatar = createMemo(() => util.getDisplayAvatar(props.user, props.member));

	return (
		<div class={styles.userButton}>
			<img class={utilStyles.cover} src={displayAvatar()} alt={displayName()} style={{ width: '28px', height: '28px' }} />

			<div class={styles.userDetail}>
				<span>{displayName()}</span>

				<span class={styles.userPresence}>
					<Switch fallback="Online">
						<Match when={!props.user.online || props.user.status?.presence == 'Invisible'}>
							Offline
						</Match>
						<Match when={props.user.status?.text}>{(text) => text()}</Match>
						<Match when={props.user.status?.presence == 'Busy'}>Do Not Disturb</Match>
						<Match when={props.user.status?.presence}>{(presence) => presence()}</Match>
					</Switch>
				</span>
			</div>
		</div>
	);
}
