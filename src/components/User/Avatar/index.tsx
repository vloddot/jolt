import { Show, createMemo, mergeProps } from 'solid-js';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import util from '@lib/util';

export interface Props {
	user: User | string;
	member?: Member;
	message?: Message;
	showPresence?: boolean;
	width?: string;
	height?: string;
	presenceIndicatorWidth?: string;
	presenceIndicatorHeight?: string;
}

export default function UserAvatar(_props: Props) {
	const props = mergeProps({ width: '28px', height: '28px', showPresence: false }, _props);

	const displayName = createMemo(() =>
		typeof props.user == 'string'
			? props.user
			: util.getDisplayName(props.user, props.member, props.message)
	);

	const displayAvatar = createMemo(() =>
		typeof props.user == 'string'
			? util.getDefaultUserAvatar(props.user)
			: util.getDisplayAvatar(props.user, props.member, props.message)
	);

	return (
		<div class={styles.userAvatar} style={{ width: props.width, height: props.height }}>
			<Show when={props.showPresence && typeof props.user != 'string' && props.user}>
				{(user) => {
					const presenceColor = createMemo(() => {
						const presence: Presence = user().online
							? user().status?.presence ?? 'Online'
							: 'Invisible';

						return `var(--status-${presence.toLowerCase()})`;
					});

					return (
						<span
							class={styles.presenceIcon}
							style={{
								'--presence-color': presenceColor(),
								width: props.presenceIndicatorWidth,
								height: props.presenceIndicatorHeight
							}}
						/>
					);
				}}
			</Show>
			<img
				class={utilStyles.cover}
				src={displayAvatar()}
				loading="lazy"
				alt={displayName()}
				style={{ width: props.width, height: props.height }}
			/>
		</div>
	);
}
