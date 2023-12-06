import api from '@lib/api';
import { A } from '@solidjs/router';
import { Match, Show, Switch, createMemo, createResource, useContext } from 'solid-js';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import util from '@lib/util';
import { SelectedChannelContext } from '@lib/context/SelectedChannel';
import MessageCollectionContext from '@components/TextChannel/context/MessageCollection';
import { AiFillFileText } from 'solid-icons/ai';

export interface Props {
	to_id: string;
	from: Message;
}

export default function MessageReply(props: Props) {
	const selectedChannel = useContext(SelectedChannelContext);
	const collection = useContext(MessageCollectionContext);

	const [message] = createResource(
		() => [selectedChannel()!._id, props.to_id, collection()?.messages] as const,
		async ([channel_id, message_id, messages]) => {
			return messages?.[message_id] ?? api.fetchMessage([channel_id, message_id]);
		}
	);

	const [user] = createResource(() => message()?.author, api.fetchUser);

	return (
		<div class={styles.replyBase}>
			<Switch fallback={<>Unresolved message</>}>
				<Match when={message.state == 'errored'}>Error loading message</Match>
				<Match when={message.state == 'pending' || message.state == 'refreshing'}>
					Loading message...
				</Match>
				<Match when={message.state == 'unresolved'}>Unresolved message</Match>
				<Match when={message.state == 'ready' && message()}>
					{(message) => {
						return (
							<A class={styles.replyMeta} href={`#MESSAGE-${message()._id}`}>
								<Switch>
									<Match when={user.state == 'errored'}>Error loading user</Match>
									<Match when={user.state == 'pending' || user.state == 'refreshing'}>
										Loading user...
									</Match>
									<Match when={user.state == 'unresolved'}>Unresolved user</Match>
									<Match when={user.state == 'ready' && user()}>
										{(user) => {
											const [member] = createResource(
												() => [user()._id, collection()?.members] as const,
												async ([user_id, members]) => {
													const c = selectedChannel();
													if (
														c == undefined ||
														(c.channel_type != 'TextChannel' && c.channel_type != 'VoiceChannel')
													) {
														return members?.[user_id];
													}

													return (
														members?.[user_id] ??
														api.fetchMember({ server: c.server, user: user_id })
													);
												}
											);

											const displayName = createMemo(() =>
												util.getDisplayName(user(), member(), message())
											);

											const displayAvatar = createMemo(() =>
												util.getDisplayAvatar(user(), member(), message())
											);

											return (
												<>
													<img
														class={utilStyles.cover}
														style={{ width: '14px', height: '14px' }}
														src={displayAvatar()}
														alt={displayName()}
													/>
													<span>
														<Show when={props.from.mentions?.includes(user()._id)}>@</Show>
														{displayName()}
													</span>
												</>
											);
										}}
									</Match>
								</Switch>

								<Show when={message().attachments?.length != 0 && message().attachments}>
									{(attachments) => (
										<>
											<AiFillFileText />
											<span>
												<Switch>
													<Match when={attachments().length == 1}>Sent an attachment</Match>
													<Match when={attachments().length > 1 && attachments().length}>
														{(len) => <>Sent {len()} attachments</>}
													</Match>
												</Switch>
											</span>
										</>
									)}
								</Show>
								<Show when={message().embeds}>
									{(embeds) => (
										<Switch>
											<Match when={embeds().length == 1}>Sent an embed</Match>
											<Match when={embeds().length > 1 && embeds().length}>
												{(len) => <>Sent {len()} embeds</>}
											</Match>
										</Switch>
									)}
								</Show>
								<span>{message().content}</span>
							</A>
						);
					}}
				</Match>
			</Switch>
		</div>
	);
}
