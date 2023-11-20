import { type JSX, createSignal, mergeProps, children, createComputed } from 'solid-js';
import styles from './index.module.scss';
import type { Content } from 'tippy.js';
import { A } from '@solidjs/router';
import { useTippy } from 'solid-tippy';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale-subtle.css';

interface Props {
	href: string;
	tooltip: Content;
	selected: boolean;
	unread?: boolean;
	children: JSX.Element;
}

function ServerSidebarIcon(_props: Props) {
	const props = mergeProps({ unread: false }, _props);
	const [focused, setFocused] = createSignal(false);

	const c = children(() => props.children);

	const [tooltipTarget, setTooltipTarget] = createSignal<Element>();

	createComputed(() =>
		useTippy(tooltipTarget, {
			hidden: true,
			props: {
				placement: 'right',
				content: props.tooltip,
				theme: 'right-tooltip',
				animation: 'scale-subtle',
				duration: 100
			}
		})
	);

	return (
		<div
			class={styles['icon-container']}
			aria-selected={props.selected}
			data-selected={props.selected}
			data-focused={focused()}
			data-unread={props.unread}
		>
			<A
				class={styles.icon}
				href={props.href}
				onMouseOver={() => setFocused(true)}
				onMouseLeave={() => setFocused(false)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				aria-label={props.tooltip.toString()}
				ref={setTooltipTarget}
			>
				{c()}
			</A>
		</div>
	);
}

export default ServerSidebarIcon;
