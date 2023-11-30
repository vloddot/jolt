import api from '@lib/api';
import { getMessageCollection, type MessageCollection } from '@lib/messageCollections';
import { A } from '@solidjs/router';
import { Match, Switch, createMemo, createResource, useContext } from 'solid-js';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import util from '@lib/util';
import { SelectedChannelContext } from '@lib/context/selectedChannel';

export interface Props {
	message_id: string;
}

export default function MessageReply(props: Props) {
	const selectedChannel = useContext(SelectedChannelContext)!;
	const [collection] = createResource(() => selectedChannel()?._id, getMessageCollection);

	const [message] = createResource(
		() =>
			[selectedChannel()?._id, props.message_id, collection()?.messages[props.message_id]] as [
				string,
				string,
				MessageCollection['messages'] | undefined
			],
		async ([channel_id, message_id, messages]) => {
			return messages?.[message_id] ?? api.fetchMessage([channel_id, message_id]);
		}
	);

	const [user] = createResource(() => message()?.author, api.fetchUser);

	return (
		<div class={styles.replyBase}>
			<Switch>
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
												() =>
													[user()._id, collection()?.members] as [
														string,
														MessageCollection['members']
													],
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

											const displayName = createMemo(() => util.getDisplayName(user(), member(), message()));
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
													<span>{displayName()}</span>
												</>
											);
										}}
									</Match>
								</Switch>

								<span>{message().content}</span>
							</A>
						);
					}}
				</Match>
			</Switch>
		</div>
	);
}
