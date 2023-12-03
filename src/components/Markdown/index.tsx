import utilStyles from '@lib/util.module.scss';
import styles from './index.module.scss';
import { createEffect, createMemo, createResource, createRoot, useContext } from 'solid-js';
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

	async function parser(
		regex: RegExp,
		replacer: (group: string) => Node,
		options?: Partial<{ getEnd: (group: string) => number }>
	) {
		for (const node of Array.from(ref.childNodes).flatMap(function m(node): Node[] {
			if (node instanceof Text) {
				return [node];
			}

			return Array.from(node.childNodes.values()).flatMap(m);
		})) {
			const matches = node.textContent?.matchAll(regex);
			for (const match of matches ?? []) {
				const group = match[1];
				if (group == undefined) {
					continue;
				}

				const element = await replacer(group);

				if (element == undefined) {
					continue;
				}

				const index = match.index;
				if (index == undefined) {
					continue;
				}

				const start = new Text(node.textContent?.substring(0, index).trim() ?? '');
				const end = new Text(
					node.textContent?.substring(index + (options?.getEnd?.(group) ?? 0)).trim() ?? ''
				);

				node.nodeValue = '';

				node.parentNode?.append(start);
				node.parentNode?.append(end);
				node.parentNode?.insertBefore(element, end);
			}
		}
	}

	createEffect(() => {
		ref.innerHTML = converter.makeHtml(
			props.children
				.replace(new RegExp('<', 'g'), '&lt;')
				.replace(new RegExp('>', 'g'), '&gt;')
				.replace(new RegExp('/', 'g'), '&#47;')
		);

		parser(
			RE_EMOJI,
			(emoji) => {
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
							src = `https://static.revolt.chat/emoji/twemoji/${standard
								.codePointAt(0) // emoji component
								?.toString(16)}.svg`; // convert to hex
						}

						img.src = src ?? `https://autumn.revolt.chat/emojis/${emoji}`;
					});

					return img;
				});
			},
			{ getEnd: (emoji) => emoji.length + 2 }
		);

		parser(
			RE_MENTION,
			(id) => {
				return createRoot(() => {
					const [user] = createResource(() => id, api.fetchUser);
					const [member] = createResource(() => {
						const server = selectedServerId();
						if (server == undefined) {
							return;
						}

						return { server, user: id };
					}, api.fetchMember);

					const div = document.createElement('div');
					div.classList.add(styles.mention);

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

					div.append(img);
					div.append(nameElement);

					return div;
				});
			},
			{ getEnd: (id) => id.length + 3 }
		);

		parser(
			RE_CHANNEL,
			(id) => {
				return createRoot(() => {
					const [channel] = createResource(() => id, api.fetchChannel);

					const a = document.createElement('a');

					a.onclick = (event) => {
						event.preventDefault();
						navigate(a.pathname);
					};

					createEffect(() => {
						const c = channel();
						if (c == undefined) {
							return;
						}

						a.href = `${
							selectedServerId() == undefined ? '' : `/servers/${selectedServerId()}`
						}/channels/${c._id}`;

						switch (c.channel_type) {
							case 'Group':
							case 'TextChannel':
							case 'VoiceChannel': {
								a.innerText = `#${c.name}`;
								break;
							}
						}
					});

					return a;
				});
			},
			{ getEnd: (id) => id.length + 3 }
		);
	});

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
