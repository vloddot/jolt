// @ts-expect-error No typings
import htmlescape from 'showdown-htmlescape';
import xss from 'xss';
import utilStyles from '@lib/util.module.scss';
import styles from './index.module.scss';
import { createEffect, createMemo, createRoot, on, useContext } from 'solid-js';
import { RE_CHANNEL, RE_EMOJI, RE_MENTION } from '@lib/regex';
import showdown from 'showdown';
import emojis from '@lib/emojis.json';
import { SelectedServerIdContext } from '@lib/context/SelectedServerId';
import util from '@lib/util';
import { useNavigate } from '@solidjs/router';
import { SettingsContext } from '@lib/context/Settings';
import { ServerMembersListContext } from '@lib/context/collections/ServerMembersList';
import { UserCollectionContext } from '@lib/context/collections/Users';
import { ChannelCollectionContext } from '@lib/context/collections/Channels';

export interface Props {
	children: string;
}

const converter = new showdown.Converter({
	ghCompatibleHeaderId: true,
	openLinksInNewWindow: true,
	strikethrough: true,
	tables: true,
	tasklists: true,
	underline: true,
	extensions: [htmlescape]
});

export default function Markdown(props: Props) {
	const selectedServerId = useContext(SelectedServerIdContext);
	const membersList = useContext(ServerMembersListContext);
	const users = useContext(UserCollectionContext);
	const channels = useContext(ChannelCollectionContext);
	const navigate = useNavigate();

	const { settings } = useContext(SettingsContext);

	let ref: HTMLSpanElement;

	/**
	 * Macro function to generate parsers for emojis, mentions, etc.
	 * Thanks to `@ShadowLp174#0667` on Revolt for the algorithm.
	 * @param regex Regex to match
	 * @param replacer Element replacer function, takes the first group of the regex and returns a `Node`
	 */
	function parser(regex: RegExp, replacer: (group: RegExpMatchArray) => Node) {
		for (const node of Array.from(ref.childNodes).flatMap(function flattenTextNodes(node): Text[] {
			// flatten out text nodes
			if (node instanceof Text) {
				return [node];
			}

			return Array.from(node.childNodes.values()).flatMap(flattenTextNodes);
		})) {
			const originalNV = node.nodeValue ?? '';

			// get all the matches for the regular expression
			const matches = originalNV.matchAll(regex);

			// variable to keep track of the index of the already matched content
			let alreadyMatched = 0;

			// for each match, replace the text nodes with the elements needed
			for (const match of matches ?? []) {
				// the group for the replacer function to use
				if (match.index == undefined) {
					continue;
				}

				// get match replacement
				const element = replacer(match);

				// split the node into two parts, end ^1 and start ^2

				// ^1; start from the end of the match to the end of the string
				node.nodeValue = originalNV.substring(match.index + match[0].length);

				// ^2; skip over any matched content and end at the start of the match
				const start = new Text(originalNV.substring(alreadyMatched, match.index));

				// insert replacement before the ending node
				node.parentNode?.insertBefore(element, node);

				// insert start before the replacement node
				node.parentNode?.insertBefore(start, element);

				// update already matched content...
				alreadyMatched = match.index + match[0].length;
			}
		}
	}

	createEffect(
		on(
			() => props.children,
			(children) => {
				ref.innerHTML = xss(converter.makeHtml(children));

				parser(RE_EMOJI, (match) => {
					const emoji = match[1];

					return createRoot(() => {
						let src: string | undefined;

						const text = new Text(match[0]);

						const img = document.createElement('img');
						img.classList.add(styles.emoji);
						img.onload = () => {
							text.replaceWith(img);
						};

						createEffect(() => {
							const standard = (emojis.standard as Record<string, string>)[emoji];
							if (standard == undefined) {
								const custom = (emojis.custom as Record<string, string>)[emoji];
								if (custom != undefined) {
									src = `${settings.instance.legacyEmotes}/projects/revolt/emotes/${custom}`;
								}
							} else {
								const emojiComponent = standard.codePointAt(0)?.toString(16);
								src = `${settings.instance.emotes}/${emojiComponent}.svg`;
							}

							img.src = src ?? `${settings.instance.autumn}/emojis/${emoji}`;
						});

						return text;
					});
				});

				parser(RE_MENTION, (match) => {
					const id = match[1];
					return createRoot(() => {
						const user = createMemo(() => users.get(id)?.[0]);
						const member = createMemo(() => membersList()?.members.get(id));

						const mentionElement = document.createElement('span');
						mentionElement.classList.add(styles.mention);

						const img = document.createElement('img');
						img.classList.add(utilStyles.cover);
						img.style.width = '16px';
						img.style.height = '16px';

						const displayName = createMemo(() => {
							const u = user();
							if (u == undefined) {
								return id;
							}

							return util.getDisplayName(u, member());
						});

						const displayAvatar = createMemo(() =>
							util.getDisplayAvatar({ ...(user() ?? {}), _id: id }, member())
						);

						const nameElement = document.createElement('span');
						createEffect(() => {
							img.alt = displayName();
							img.src = displayAvatar();
							nameElement.innerText = displayName();
						});

						mentionElement.append(img);
						mentionElement.append(nameElement);

						return mentionElement;
					});
				});

				parser(RE_CHANNEL, (match) => {
					const id = match[1];
					return createRoot(() => {
						const channel = createMemo(() => channels.get(id)?.[0]);

						const anchor = document.createElement('a');

						anchor.onclick = (event) => {
							event.preventDefault();
							navigate(anchor.pathname);
						};

						createEffect(() => {
							const c = channel();
							if (c == undefined) {
								anchor.innerHTML = `#${id}`;
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
