import { A } from '@solidjs/router';
import type { JSX } from 'solid-js';
import styles from './index.module.scss';

export interface Props {
	href: string;
	selected: boolean;
	unread: boolean;
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
		</A>
	);
}
