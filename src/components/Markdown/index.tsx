import styles from './index.module.scss';
import DOMPurify from 'dompurify';
import { createEffect, createMemo } from 'solid-js';
import emojis from '@lib/emojis.json';
import { RE_EMOJI } from '@lib/regex';
import showdown from 'showdown';

export interface Props {
	content: string;
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

	createEffect(() => (ref.innerHTML = DOMPurify.sanitize(converter.makeHtml(props.content))));

	createEffect(() => {
		const emojiMatches = props.content.matchAll(RE_EMOJI);
		for (const match of emojiMatches) {
			const emoji = match[1];
			if (emoji == undefined) {
				continue;
			}

			let src: string | undefined;

			const standard = (emojis.standard as Record<string, string>)[emoji];
			if (standard == undefined) {
				const custom = (emojis.custom as Record<string, string>)[emoji];
				if (custom != undefined) {
					src = `https://dl.insrt.uk/projects/revolt/emotes/${custom}`;
				}
			} else {
				src = `https://static.revolt.chat/emoji/twemoji/${standard
					.codePointAt(0) // emoji component
					?.toString(16)}.svg`; // convert to hex
			}

			const img = document.createElement('img');
			img.classList.add(styles.emoji);
			img.src = src ?? `https://autumn.revolt.chat/emojis/${emoji}`;

			img.onload = () => {
				ref.innerHTML = ref.innerHTML.replace(new RegExp(`:${emoji}:`, 'g'), img.outerHTML);
			};
		}
	});

	const isOnlyEmoji = createMemo(() => props.content.replace(RE_EMOJI, '').trim().length == 0);

	return (
		<span
			style={{ '--emoji-size': isOnlyEmoji() ? '3em' : '1em' }}
			class={styles.markdownBase}
			ref={ref!}
		>
			{/*@once*/ props.content}
		</span>
	);
}
