import {
	For,
	Match,
	Switch,
	createResource,
	useContext,
	createSignal,
	Show,
	type JSX,
	createComputed,
	createMemo,
	onMount,
	onCleanup,
	createEffect,
	type Accessor
} from 'solid-js';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import api from '@lib/api';
import { MessageComponent } from './Message';
import { RepliesContext } from './context/Replies';
import TextArea from './TextArea';
import util from '@lib/util';
import { MessageInputContext } from './context/MessageInput';
import { getMessageCollection, type MessageCollection } from '@lib/messageCollections';
import { decodeTime } from 'ulid';
import { SelectedServerContext } from '@lib/context/SelectedServer';
import AttachmentPreviewItem from './AttachmentPreviewItem';
import { AiFillFileText, AiOutlinePlus } from 'solid-icons/ai';
import { FiXCircle } from 'solid-icons/fi';
import SendableReplyComponent from './SendableReply';
import { SelectedChannelContext } from '@lib/context/SelectedChannel';
import { FaSolidUserSecret } from 'solid-icons/fa';
import { SelectedChannelIdContext } from '@lib/context/SelectedChannelId';
import MessageCollectionContext from './context/MessageCollection';
import { ChannelCollectionContext } from '@lib/context/collections/Channels';
import { on } from 'solid-js';
import { SessionContext } from '@lib/context/Session';
import EditingMessageIdContext from './context/EditingMessageId';
import { ServerMembersListContext } from '@lib/context/collections/ServerMembersList';

export default function TextChannel() {
	const selectedChannelId = useContext(SelectedChannelIdContext);
	const channelCollection = useContext(ChannelCollectionContext);
	const channel = createMemo(() => channelCollection.get(selectedChannelId() ?? '')?.[0]);

	const [messageCollection] = createResource(selectedChannelId, getMessageCollection);

	return (
		<Switch>
			<Match when={messageCollection.state == 'errored'}>Error loading messages</Match>
			<Match when={messageCollection.state == 'pending'}>Loading messages...</Match>
			<Match when={messageCollection.state == 'refreshing'}>Reloading messages...</Match>
			<Match when={messageCollection.state == 'unresolved' || channel() == undefined}>
				Unresolved channel.
			</Match>
			<Match
				keyed
				when={
					messageCollection.state == 'ready' &&
					channel() != undefined && { channel: channel(), collection: messageCollection() }
				}
			>
				{(accessor) => {
					return (
						<MessageCollectionContext.Provider value={messageCollection}>
							<SelectedChannelContext.Provider value={channel}>
								<TextChannelMeta collection={accessor.collection} />
							</SelectedChannelContext.Provider>
						</MessageCollectionContext.Provider>
					);
				}}
			</Match>
		</Switch>
	);
}

interface MetaProps {
	collection: MessageCollection;
}

function TextChannelMeta(props: MetaProps) {
	const server = useContext(SelectedServerContext);
	const channel = useContext(SelectedChannelContext)!;
	const membersList = useContext(ServerMembersListContext);
	const [messageInput, setMessageInput] = useContext(MessageInputContext);
	const [replies, setReplies] = useContext(RepliesContext)!;
	const [session] = useContext(SessionContext);
	const [, setEditingMessageId] = useContext(EditingMessageIdContext);

	const [showMasqueradeControls, setShowMasqueradeControls] = createSignal(false);

	// does not need reactivity
	let masqueradeName = '';
	let masqueradeAvatar = '';

	let messageTextarea: HTMLTextAreaElement;
	let messageListElement: HTMLDivElement;

	function createUserResource(target: Accessor<string>) {
		return createResource(
			() => [target(), props.collection.users[target()] as User | undefined] as const,
			([target, user]) => {
				if (user == undefined) {
					// specifically not awaiting here to make the request happen only once (for caching)
					const u = api.fetchUser(target);
					props.collection.users[target] = u;
					return u;
				}

				return user;
			}
		);
	}

	function createMemberResource(target: Accessor<string>) {
		return createResource(
			() =>
				[
					target(),
					props.collection.members[target()] ?? membersList()?.members.get(target())
				] as const,
			([target, member]) => {
				const s = server()?._id;
				if (member != undefined) {
					return member;
				}

				if (s == undefined) {
					return;
				}

				// specifically not awaiting here to make the request happen only once (for caching)
				const m = api.fetchMember({ server: s, user: target });
				props.collection.members[target] = m;
				return m;
			}
		);
	}

	const onPaste: GlobalEventHandlers['onpaste'] = (event) => {
		if (event.clipboardData?.files != null && event.clipboardData.files.length != 0) {
			event.preventDefault();
			const clipboardAttachments = Array.from(event.clipboardData.files);
			setAttachments((attachments) => [...attachments, ...(clipboardAttachments ?? [])]);
		}
	};

	const onKeyDown: GlobalEventHandlers['onkeydown'] = (event) => {
		if (event.key != 'Escape') {
			return;
		}

		messageListElement.scrollTop = messageListElement.scrollHeight;
		if (!util.inputSelected()) {
			messageTextarea.focus();
		}
	};

	onMount(() => {
		document.addEventListener('paste', onPaste);
		document.addEventListener('keydown', onKeyDown);
		onCleanup(() => {
			document.removeEventListener('paste', onPaste);
			document.removeEventListener('keydown', onKeyDown);
		});
	});

	const [attachments, setAttachments] = createSignal<File[]>([]);
	const [channelName, setChannelName] = createSignal('<Unknown Channel>');

	createComputed(() => {
		const c = channel();
		if (c == undefined) {
			setChannelName('<Unknown Channel>');
			return;
		}

		if (c.channel_type == 'SavedMessages') {
			setChannelName('Saved Notes');
			return;
		}

		if (c.channel_type == 'DirectMessage') {
			// until the fetch request finishes
			setChannelName('DM');

			const recipient = util.getOtherRecipient(c!.recipients);
			if (recipient == undefined) {
				return;
			}

			api.fetchUser(recipient).then((recipient) => setChannelName(`@${recipient.username}`));
			return;
		}

		setChannelName(`#${c.name}`);
	});

	const sendMessage: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (event) => {
		event.preventDefault();

		const c = channel();
		if (c == undefined) {
			return;
		}

		const data: DataMessageSend = {};

		if (attachments().length != 0) {
			data.attachments = await Promise.all(
				attachments().map((attachment) => api.uploadAttachment(attachment))
			);
			setAttachments([]);
		}

		if (replies().length > 0) {
			data.replies = replies().map(([reply]) => ({
				id: reply.message._id,
				mention: reply.mention
			}));
			setReplies([]);
		}

		const content = messageInput().trim();
		if (content != '') {
			data.content = content;
			setMessageInput('');
			messageTextarea.value = '';
		}

		const masqname = masqueradeName.trim();
		if (masqname != '') {
			data.masquerade = data.masquerade ?? {};
			data.masquerade.name = masqname;
		}

		const masqavatar = masqueradeAvatar.trim();
		if (masqavatar != '') {
			data.masquerade = data.masquerade ?? {};
			data.masquerade.avatar = masqavatar;
		}

		if (masqueradeName != '' || masqueradeAvatar != '') {
			data.masquerade = { name: masqueradeName, avatar: masqueradeAvatar };
		}

		if (Object.keys(data).length == 0) {
			return;
		}

		await api.sendMessage(c._id, data);
	};

	function pushFile() {
		const input = document.createElement('input');
		input.type = 'file';

		input.onchange = (e) => {
			const event = e as InputEvent & { target: { files?: FileList } };
			setAttachments((attachments) => [...attachments, ...Array.from(event.target.files ?? [])]);
		};

		input.click(); // click :3
	}

	const typing = createMemo(() => {
		return Array.from(props.collection.typing.values()).map((user) => ({
			user: createUserResource(() => user)[0],
			member: createMemberResource(() => user)[0]
		}));
	});

	const messages = createMemo(() => Object.values(props.collection.messages));

	createEffect(
		on(messages, (messages) => {
			messageListElement.scrollTop = messageListElement.scrollHeight;
			const message = messages.pop();
			if (message == undefined) {
				return;
			}

			api.ackMessage(message.channel, message._id);
		})
	);

	return (
		<>
			<div class={styles.messageList} ref={messageListElement!}>
				<For each={messages()}>
					{(message, messageIndex) => {
						return (
							<Show when={message != undefined && message}>
								{(message) => {
									const [author] = createUserResource(() => message().author);
									const [member] = createMemberResource(() => message().author);

									return (
										<Show when={author.state == 'ready' && author()}>
											{(author) => {
												const isHead = createMemo(() => {
													const lastMessage = messages()[messageIndex() - 1];

													if (lastMessage == undefined) {
														return true;
													}

													return (
														message().author != lastMessage.author ||
														message().masquerade?.name != lastMessage.masquerade?.name ||
														message().masquerade?.avatar != lastMessage.masquerade?.avatar ||
														message().masquerade?.colour != lastMessage.masquerade?.colour ||
														decodeTime(message()._id) - decodeTime(lastMessage._id) >=
															7 * 60 * 1000 ||
														(message().replies?.length ?? 0) != 0
													);
												});

												return (
													<MessageComponent
														message={message()}
														author={author()}
														member={member()}
														isHead={isHead()}
													/>
												);
											}}
										</Show>
									);
								}}
							</Show>
						);
					}}
				</For>
			</div>

			<Show when={attachments().length != 0 && attachments()}>
				{(attachments) => {
					const onKeyDown: GlobalEventHandlers['onkeydown'] = (event) => {
						if (event.key != 'Escape') {
							return;
						}

						event.preventDefault();
						setAttachments((attachments) => attachments.slice(0, attachments.length - 1));
					};

					onMount(() => {
						document.addEventListener('keydown', onKeyDown);
						onCleanup(() => document.removeEventListener('keydown', onKeyDown));
					});

					return (
						<div class={styles.attachmentPreviewBase}>
							<div class={styles.attachmentPreview}>
								<For each={attachments()}>
									{(attachment, index) => {
										return (
											<AttachmentPreviewItem
												overlay={<FiXCircle size={30} />}
												metadata={{ name: attachment.name, size: attachment.size }}
												action={() => {
													setAttachments((attachments) =>
														attachments.filter((_, i) => i != index())
													);
												}}
											>
												<Show
													when={attachment.type.startsWith('image/')}
													fallback={<AiFillFileText size={30} />}
												>
													<img src={URL.createObjectURL(attachment)} />
												</Show>
											</AttachmentPreviewItem>
										);
									}}
								</For>
								<AttachmentPreviewItem action={pushFile}>
									<AiOutlinePlus size={24} />
								</AttachmentPreviewItem>
							</div>
							<hr />
						</div>
					);
				}}
			</Show>
			<div class={styles.messageFormBase}>
				<For each={replies()}>
					{([reply, setReply]) => {
						const onKeyDown: GlobalEventHandlers['onkeydown'] = (event) => {
							if (event.key != 'Escape') {
								return;
							}

							event.preventDefault();
							setReplies((replies) => replies.slice(0, replies.length - 1));
						};

						onMount(() => {
							document.addEventListener('keydown', onKeyDown);
							onCleanup(() => document.removeEventListener('keydown', onKeyDown));
						});
						return <SendableReplyComponent reply={reply} setReply={setReply} />;
					}}
				</For>
				<form id="send-message-form" class={styles.messageForm} onSubmit={sendMessage}>
					<button onClick={() => (attachments().length == 0 ? pushFile() : setAttachments([]))}>
						<AiOutlinePlus
							size={24}
							style={{
								transform: attachments().length == 0 ? 'none' : 'rotate(45deg)',
								transition: 'transform 150ms'
							}}
						/>
					</button>
					<TextArea
						placeholder={
							channel()?.channel_type == 'DirectMessage'
								? `Send message to ${channelName()}`
								: `Send message in ${channelName()}`
						}
						ref={(r) => (messageTextarea = r)}
						sendTypingIndicators
						onInput={(event) => setMessageInput(event.currentTarget.value)}
						onKeyDown={(event) => {
							if (event.key == 'ArrowUp' && messageInput() == '') {
								// the question of the day, why can you not use `messages` at the top?
								// don't ask me it just doesn't work and does weird things
								for (const message of Object.values(props.collection.messages).reverse()) {
									if (message == undefined) {
										return;
									}

									if (message?.author == session()?.user_id) {
										setEditingMessageId(message._id);
										break;
									}
								}
								return;
							}

							if (event.shiftKey || event.key != 'Enter') {
								return;
							}

							event.preventDefault();
							event.currentTarget.form?.requestSubmit();
						}}
					/>
					<div class={utilStyles.flexDivider} />
					<Show when={showMasqueradeControls()}>
						{/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
						{(_s) => (
							<>
								<input
									type="text"
									onInput={(event) => (masqueradeName = event.currentTarget.value)}
									placeholder="Masquerade Name"
								/>
								<input
									type="text"
									onInput={(event) => (masqueradeAvatar = event.currentTarget.value)}
									placeholder="Masquerade Avatar"
								/>
							</>
						)}
					</Show>
					<button onClick={() => setShowMasqueradeControls((v) => !v)}>
						<FaSolidUserSecret size={24} />
					</button>
				</form>

				<div class={styles.typingIndicators}>
					<Switch>
						<Match when={typing().length == 1 && typing()}>
							{(typing) => {
								const user = () => typing()[0];
								return (
									<Show
										when={
											user().user.state == 'ready' && {
												user: user().user()!,
												member: user().member()
											}
										}
									>
										{(typingAccessor) => (
											<>
												{util.getDisplayName(typingAccessor().user, typingAccessor().member)} is
												typing...
											</>
										)}
									</Show>
								);
							}}
						</Match>
						<Match when={typing().length > 1 && typing().length < 5 && typing()}>
							{(typingAccessor) => {
								const names = createMemo(() =>
									typingAccessor().flatMap(({ user, member }) => {
										if (user.state == 'ready') {
											return [util.getDisplayName(user(), member())];
										}

										return [];
									})
								);

								const formattedNames = createMemo(() => {
									const namesExceptLast = names();
									const lastName = namesExceptLast.pop();
									return { namesExceptLast: namesExceptLast.join(', '), lastName };
								});

								return (
									<>
										{formattedNames().namesExceptLast} and {formattedNames().lastName} are typing...
									</>
								);
							}}
						</Match>
						<Match when={typing().length >= 5}>Several people are typing...</Match>
					</Switch>
				</div>
			</div>
		</>
	);
}
