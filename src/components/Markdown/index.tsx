import utilStyles from '@lib/util.module.scss';
import styles from './index.module.scss';
import { createEffect, createMemo, createResource, createRoot, on, useContext } from 'solid-js';
import emojis from '@lib/emojis.json';
import { RE_CHANNEL, RE_EMOJI, RE_MENTION } from '@lib/regex';
import showdown from 'showdown';
import api from '@lib/api';
import util from '@lib/util';
import { SelectedServerIdContext } from '@lib/context/SelectedServerId';
import { useNavigate } from '@solidjs/router';

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
	const navigate = useNavigate();
	let ref: HTMLSpanElement;
	const selectedServerId = useContext(SelectedServerIdContext);

	/**
	 * Macro function to generate parsers for emojis, mentions, etc.
	 * Thanks to `@ShadowLp174#0667` on Revolt for the algorithm.
	 * @param regex Regex to match
	 * @param replacer Element replacer function, takes the first group of the regex and returns a `Node`
	 */
	function parser(regex: RegExp, replacer: (group: string) => Node) {
		for (const node of Array.from(ref.childNodes).flatMap(function flattenTextNodes(node): Text[] {
			// flatten out text nodes
			if (node instanceof Text) {
				return [node];
			}

			return Array.from(node.childNodes.values()).flatMap(flattenTextNodes);
		})) {
			const originalNV = node.nodeValue;

			// get all the matches for the regular expression
			const matches = originalNV?.matchAll(regex);

			// for each match, replace the text nodes with the elements needed
			for (const match of matches ?? []) {
				// the group for the replacer function to use
				const group = match[1];
				if (group == undefined || match.index == undefined) {
					continue;
				}

				// get match replacement
				const element = replacer(group);
				if (element == undefined) {
					continue;
				}

				// split the node into two parts, end ^1 and start ^2

				// ^1: end
				node.nodeValue = originalNV?.substring(match.index + match[0].length).trim() ?? '';

				// ^2: start
				const start = new Text(node.nodeValue?.substring(0, match.index).trim() ?? '');

				// insert replacement before the ending node
				node.parentNode?.insertBefore(element, node);

				// insert start before the replacement node
				node.parentNode?.insertBefore(start, element);
			}
		}
	}

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

				parser(RE_EMOJI, (emoji) => {
					return createRoot(() => {
						let src: string | undefined;

						const img = document.createElement('img');
						img.classList.add(styles.emoji);
						img.onerror = () => {
							img.replaceWith(`:${emoji}:`);
						};

						createEffect(() => {
							const standard = (emojis.standard as Record<string, string>)[emoji];
							if (standard == undefined) {
								const custom = (emojis.custom as Record<string, string>)[emoji];
								if (custom != undefined) {
									src = `https://dl.insrt.uk/projects/revolt/emotes/${custom}`;
								}
							} else {
								const emojiComponent = standard.codePointAt(0)?.toString(16);
								src = `https://static.revolt.chat/emoji/twemoji/${emojiComponent})}.svg`;
							}

							img.src = src ?? `https://autumn.revolt.chat/emojis/${emoji}`;
						});

						return img;
					});
				});

				parser(RE_MENTION, (id) => {
					return createRoot(() => {
						const [user] = createResource(() => id, api.fetchUser);
						const [member] = createResource(() => {
							const server = selectedServerId();
							if (server == undefined) {
								return;
							}

							return { server, user: id };
						}, api.fetchMember);

						const mentionElement = document.createElement('span');
						mentionElement.classList.add(styles.mention);

						const img = document.createElement('img');
						img.classList.add(utilStyles.cover);
						img.style.width = '16px';
						img.style.height = '16px';

						const displayName = createMemo(() =>
							user.state == 'ready' ? util.getDisplayName(user(), member()) : undefined
						);

						const displayAvatar = createMemo(() =>
							user.state == 'ready' ? util.getDisplayAvatar(user(), member()) : undefined
						);

						const nameElement = document.createElement('span');
						createEffect(() => {
							img.alt = displayName() ?? '';
							img.src = displayAvatar() ?? '';
							nameElement.innerText = displayName() ?? '';
						});

						mentionElement.append(img);
						mentionElement.append(nameElement);

						return mentionElement;
					});
				});

				parser(RE_CHANNEL, (id) => {
					return createRoot(() => {
						const [channel] = createResource(() => id, api.fetchChannel);

						const anchor = document.createElement('a');

						anchor.onclick = (event) => {
							event.preventDefault();
							navigate(anchor.pathname);
						};

						createEffect(() => {
							const c = channel();
							if (c == undefined) {
								return;
							}

							anchor.href = `${
								selectedServerId() == undefined ? '' : `/servers/${selectedServerId()}`
							}/channels/${c._id}`;

							switch (c.channel_type) {
								case 'Group':
								case 'TextChannel':
								case 'VoiceChannel': {
									anchor.innerText = `#${c.name}`;
									break;
								}
							}
						});

						return anchor;
					});
				});
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
