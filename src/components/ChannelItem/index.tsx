import { A } from '@solidjs/router';
import { Show, type JSX } from 'solid-js';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';

export interface Props {
	href: string;
	selected: boolean;
	unread: boolean;
	mentions?: number;
	children: JSX.Element;
}

export default function ChannelItem(props: Props) {
	return (
		<A
			class={styles.channelItem}
			href={props.href}
			data-selected={props.selected}
			aria-selected={props.selected}
			data-unread={props.unread}
		>
			{props.children}
			<div class={utilStyles.flexDivider} />
			<Show when={props.mentions}>
				{(count) => <div class={styles.mentionsBadge}>{count()}</div>}
			</Show>
		</A>
	);
}
