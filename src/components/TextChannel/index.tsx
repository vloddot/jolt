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
	onCleanup
} from 'solid-js';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import api from '@lib/api';
import { MessageComponent } from './Message';
import { RepliesContext } from './context/replies';
import TextArea from './TextArea';
import util from '@lib/util';
import { MessageInputContext } from './context/messageInput';
import { getMessageCollection, type MessageCollection } from '@lib/messageCollections';
import { decodeTime } from 'ulid';
import { SelectedServerContext } from '@lib/context/selectedServer';
import AttachmentPreviewItem from './AttachmentPreviewItem';
import { AiFillFileText, AiOutlinePlus } from 'solid-icons/ai';
import { FiXCircle } from 'solid-icons/fi';
import SendableReplyComponent from './SendableReply';
import { SelectedChannelContext } from '@lib/context/selectedChannel';
import { FaSolidUserSecret } from 'solid-icons/fa';

export interface Props {
	channel: Exclude<Channel, { channel_type: 'VoiceChannel' }>;
	server?: Server;
}

export default function TextChannel(props: Props) {
	const [messageCollection] = createResource(
		// eslint-disable-next-line solid/reactivity
		() => props.channel._id,
		getMessageCollection
	);

	return (
		<Switch>
			<Match when={messageCollection.state == 'errored'}>Error loading messages</Match>
			<Match when={messageCollection.state == 'pending'}>Loading messages...</Match>
			<Match when={messageCollection.state == 'refreshing'}>Reloading messages...</Match>
			<Match when={messageCollection.state == 'unresolved'}>Unresolved channel.</Match>
			<Match when={messageCollection.state == 'ready' && messageCollection()}>
				{(collection) => {
					return <TextChannelMeta collection={collection()} />;
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
	const [messageInput, setMessageInput] = useContext(MessageInputContext);
	const [replies, setReplies] = useContext(RepliesContext)!;

	const [showMasqueradeControls, setShowMasqueradeControls] = createSignal(false);

	// does not need reactivity
	let masqueradeName = '';
	let masqueradeAvatar = '';

	let messageTextarea: HTMLTextAreaElement;

	function focus() {
		// if any other input element is active, do *not* focus
		if (!['TEXTAREA', 'INPUT'].includes(document.activeElement?.nodeName ?? '')) {
			messageTextarea.focus();
		}
	}

	const onPaste: GlobalEventHandlers['onpaste'] = (event) => {
		if (event.clipboardData?.files != null && event.clipboardData.files.length != 0) {
			event.preventDefault();
			const clipboardAttachments = Array.from(event.clipboardData.files);
			setAttachments((attachments) => [...attachments, ...(clipboardAttachments ?? [])]);
		}
	};

	onMount(() => {
		focus();
		document.addEventListener('keydown', focus);
		document.addEventListener('paste', onPaste);
		onCleanup(() => {
			document.removeEventListener('keydown', focus);
			document.removeEventListener('paste', onPaste);
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
			const recipient = util.getOtherRecipient(c!.recipients);
			if (recipient == undefined) {
				setChannelName('DM');
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

		const content = messageInput();
		if (content != '') {
			data.content = content;
			setMessageInput('');
			messageTextarea.value = '';
		}

		if (replies().length > 0) {
			data.replies = replies().map(([reply]) => ({
				id: reply.message._id,
				mention: reply.mention
			}));
			setReplies([]);
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
			user: createResource(
				() => user,
				// eslint-disable-next-line solid/reactivity
				async (user) => props.collection.users[user] ?? (await api.fetchUser(user))
			)[0],
			member: createResource(
				() => user,
				// eslint-disable-next-line solid/reactivity
				async (user) => {
					const member = props.collection.members[user];
					const s = server()?._id;
					if (member == undefined && s != undefined) {
						return await api.fetchMember({ server: s, user });
					}

					return member;
				}
			)[0]
		}));
	});

	const messages = createMemo(() => Object.values(props.collection.messages));
	return (
		<>
			<div class={styles.messageList}>
				<For each={messages()}>
					{(message, messageIndex) => {
						return (
							<Show when={message != undefined && message}>
								{(message) => {
									const [author] = createResource(
										() => message().author,
										// eslint-disable-next-line solid/reactivity
										(author) => {
											const user = props.collection.users[author];
											if (user == undefined) {
												return api.fetchUser(author);
											}

											return user;
										}
									);

									const [member] = createResource(
										() => message().author,
										// eslint-disable-next-line solid/reactivity
										(author) => {
											const member = props.collection.members[author] as Member | undefined;
											const s = server()?._id;
											if (member == undefined && s != undefined) {
												return api.fetchMember({ server: s, user: author });
											}

											return member;
										}
									);

									return (
										<Show when={author.state == 'ready' && { author: author(), member: member() }}>
											{(messageData) => {
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
														author={messageData().author}
														member={messageData().member}
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
						sendTypingIndicators
						ref={messageTextarea!}
						onInput={(event) => setMessageInput(event.currentTarget.value)}
						onKeyDown={(event) => {
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
						<FaSolidUserSecret />
					</button>
				</form>

				<div class={styles.typingIndicators}>
					<Switch>
						<Match when={typing().length == 1 && typing()}>
							{(typingAccessor) => {
								const typingUser = createMemo(() => typingAccessor()[0]);
								return (
									<Show
										when={
											typingUser().user.state == 'ready' && {
												user: typingUser().user()!,
												member: typingUser().member()
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
