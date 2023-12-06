import { Show, createMemo, mergeProps } from 'solid-js';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import util from '@lib/util';

export interface Props {
	user: User;
	member?: Member;
	message?: Message;
	showPresence?: boolean;
	width?: string;
	height?: string;
}

export default function UserAvatar(_props: Props) {
	const props = mergeProps({ width: '28px', height: '28px', showPresence: false }, _props);

	const displayName = createMemo(() =>
		util.getDisplayName(props.user, props.member, props.message)
	);

	const displayAvatar = createMemo(() =>
		util.getDisplayAvatar(props.user, props.member, props.message)
	);

	return (
		<div class={styles.userAvatar}>
			<Show when={props.showPresence && props.user}>
				{(user) => {
					const presenceColor = createMemo(() => {
						const presence: Presence = user().online
							? user().status?.presence ?? 'Online'
							: 'Invisible';

						return `var(--status-${presence.toLowerCase()})`;
					});

					return (
						<span class={styles.presenceIcon} style={{ '--presence-color': presenceColor() }} />
					);
				}}
			</Show>
			<img
				class={utilStyles.cover}
				src={displayAvatar()}
				alt={displayName()}
				style={{ width: props.width, height: props.height }}
			/>
		</div>
	);
}
