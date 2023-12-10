import styles from './index.module.scss';
import util from '@lib/util';
import { Match, Switch, createMemo, useContext } from 'solid-js';
import UserAvatar from '../Avatar';
import { ServerCollectionContext } from '@lib/context/collections/Servers';

export interface Props {
	user: User;
	member?: Member;
	message?: Message;
	showPresence?: boolean;
	width?: string;
	height?: string;
}

export default function UserButton(props: Props) {
	const serverCollection = useContext(ServerCollectionContext);
	const displayName = createMemo(() =>
		util.getDisplayName(props.user, props.member, props.message)
	);

	const server = createMemo(() =>
		props.member == undefined ? undefined : serverCollection.get(props.member._id.server)?.[0]
	);

	const displayNameStyle = createMemo(() => {
		const s = server();
		if (props.member?.roles == undefined || s == undefined) {
			return {};
		}

		const color =
			util.sortRoles(s, props.member.roles).find((role) => role.colour != undefined)?.colour ??
			'inherit';

		return util.getRoleColorStyle(color);
	});

	return (
		<div class={styles.userButton}>
			<UserAvatar {...props} />

			<div class={styles.userDetail}>
				<span style={displayNameStyle()}>{displayName()}</span>

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
