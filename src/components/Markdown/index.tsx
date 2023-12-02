import utilStyles from '@lib/util.module.scss';
import styles from './index.module.scss';
import { createEffect, createMemo, useContext } from 'solid-js';
import emojis from '@lib/emojis.json';
import { RE_CHANNEL, RE_EMOJI, RE_MENTION } from '@lib/regex';
import showdown from 'showdown';
import api from '@lib/api';
import util from '@lib/util';
import { SelectedServerIdContext } from '@lib/context/SelectedServerId';
import { useNavigate } from '@solidjs/router';

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
	const selectedServerId = useContext(SelectedServerIdContext);
	const navigate = useNavigate();
	let ref: HTMLSpanElement;

	async function parser(
		regex: RegExp,
		replacer: (group: string) => Node | undefined | Promise<Node | undefined>,
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
			props.content
				.replace(new RegExp('<', 'g'), '&lt;')
				.replace(new RegExp('>', 'g'), '&gt;')
				.replace(new RegExp('/', 'g'), '&#47;')
		);

		parser(
			RE_EMOJI,
			(emoji) => {
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

				img.onerror = () => {
					img.replaceWith(`:${emoji}:`);
				};

				return img;
			},
			{ getEnd: (emoji) => emoji.length + 2 }
		);

		parser(
			RE_MENTION,
			async (id) => {
				const user = await api.fetchUser(id);

				const div = document.createElement('div');
				div.classList.add(styles.mention);

				const displayName = util.getDisplayName(user);
				const displayAvatar = util.getDisplayAvatar(user);

				const img = document.createElement('img');
				img.alt = displayName;
				img.src = displayAvatar;
				img.classList.add(utilStyles.cover);
				img.style.width = '16px';
				img.style.height = '16px';

				const nameElement = new Text(displayName);

				div.append(img);
				div.append(nameElement);

				const server = selectedServerId();
				if (server != undefined) {
					api.fetchMember({ server, user: user._id }).then((member) => {
						img.src = util.getDisplayAvatar(user, member);
						nameElement.textContent = util.getDisplayName(user, member);
					});
				}

				return div;
			},
			{ getEnd: (id) => id.length + 3 }
		);

		parser(
			RE_CHANNEL,
			async (id) => {
				const server_id = selectedServerId();
				const channel = await api.fetchChannel(id);

				const a = document.createElement('a');
				a.href = `${server_id == undefined ? '' : `/servers/${server_id}`}/channels/${channel._id}`;

				a.onclick = (event) => {
					event.preventDefault();
					navigate(a.pathname);
				};

				switch (channel.channel_type) {
					case 'Group':
					case 'TextChannel':
					case 'VoiceChannel': {
						a.textContent = `#${channel.name}`;
						break;
					}
				}

				return a;
			},
			{ getEnd: (id) => id.length + 3 }
		);
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
