import { type JSX, createSignal, children } from 'solid-js';
import styles from './index.module.scss';
import type { Content } from 'tippy.js';
import { A } from '@solidjs/router';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale-subtle.css';
import Tooltip from '@components/Tooltip';

interface Props {
	href: string;
	tooltip: Content;
	selected: boolean;
	unread: boolean;
	children: JSX.Element;
}

function ServerSidebarIcon(props: Props) {
	const [focused, setFocused] = createSignal(false);

	const c = children(() => props.children);

	return (
		<div
			class={styles['icon-container']}
			aria-selected={props.selected}
			data-selected={props.selected}
			data-focused={focused()}
			data-unread={props.unread}
		>
			<Tooltip
				placement="right"
				content={props.tooltip}
				animation="scale-subtle"
				duration={100}
			>
				<A
					class={styles.icon}
					href={props.href}
					onMouseOver={() => setFocused(true)}
					onMouseLeave={() => setFocused(false)}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					aria-label={props.tooltip.toString()}
				>
					{c()}
				</A>
			</Tooltip>
		</div>
	);
}

export default ServerSidebarIcon;
