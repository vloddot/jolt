import styles from './index.module.scss';
import { createEffect, createMemo, on } from 'solid-js';
import { RE_EMOJI } from '@lib/regex';
import showdown from 'showdown';

export interface Props {
	children: string;
}

const converter = new showdown.Converter({
	ghCompatibleHeaderId: true,
	openLinksInNewWindow: true,
	strikethrough: true,
	tables: true,
	tasklists: true,
	underline: true
});

export default function Markdown(props: Props) {
	let ref: HTMLSpanElement;

	createEffect(
		on(
			() => props.children,
			(children) => {
				ref.innerHTML = converter.makeHtml(
					children
						.replace(new RegExp('<', 'g'), '&lt;')
						.replace(new RegExp('>', 'g'), '&gt;')
						.replace(new RegExp('/', 'g'), '&#47;')
				);
			}
		)
	);

	const isOnlyEmoji = createMemo(() => props.children.replace(RE_EMOJI, '').trim().length == 0);

	return (
		<span
			style={{ '--emoji-size': isOnlyEmoji() ? '3em' : '1em' }}
			class={styles.markdownBase}
			ref={ref!}
		>
			{props.children}
		</span>
	);
}
