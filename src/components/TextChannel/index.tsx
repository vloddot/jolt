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
} from 'solid-js';
import styles from './index.module.scss';
import api from '@lib/api';
import { MessageComponent } from './Message';
import RepliesProvider from './context/replies';
import TextAreaBase from './TextAreaBase';
import { SelectedChannelContext } from './context/channel';
import util from '@lib/util';
import { MessageInputContext } from './context/messageInput';
import { getMessageCollection, type MessageCollection } from '@lib/messageCollections';
import { decodeTime } from 'ulid';
import { SelectedServerIdContext } from '@lib/context/selectedServerId';
import AttachmentPreviewItem from './AttachmentPreviewItem';
import { AiFillFileText, AiOutlinePlus } from 'solid-icons/ai';
import { FiXCircle } from 'solid-icons/fi';

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
					return (
						<MessageInputContext.Provider value={MessageInputContext.defaultValue}>
							<SelectedChannelContext.Provider value={props.channel}>
								<RepliesProvider>
									<TextChannelMeta collection={collection()} />
								</RepliesProvider>
							</SelectedChannelContext.Provider>
						</MessageInputContext.Provider>
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
	let textbox: HTMLTextAreaElement;
	const server = useContext(SelectedServerIdContext);
	const channel = useContext(SelectedChannelContext)!;

	const [attachments, setAttachments] = createSignal<File[]>([]);
	const [channelName, setChannelName] = createSignal('<Unknown Channel>');
	createComputed(() => {
		if (channel == undefined) {
			setChannelName('<Unknown Channel>');
			return;
		}

		if (channel.channel_type == 'SavedMessages') {
			setChannelName('Saved Notes');
			return;
		}

		if (channel.channel_type == 'DirectMessage') {
			const recipient = util.getOtherRecipient(channel.recipients);
			if (recipient == undefined) {
				setChannelName('DM');
				return;
			}

			api.fetchUser(recipient).then((recipient) => setChannelName(`@${recipient.username}`));
			return;
		}

		setChannelName(`#${channel.name}`);
	});

	const sendMessage: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (event) => {
		event.preventDefault();
		if (channel == undefined) {
			return;
		}

		const data: DataMessageSend = {};

		if (attachments().length != 0) {
			data.attachments = await Promise.all(
				attachments().map((attachment) => api.uploadAttachment(attachment))
			);
		}

		const content = textbox.value.trim();
		if (content != '') {
			data.content = content;
		}

		await api.sendMessage(channel._id, data);
		textbox.value = '';
		setAttachments([]);
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

	const messages = createMemo(() => Object.values(props.collection.messages));
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
				async (user) =>
					props.collection.members[user] ?? (await api.fetchMember({ server: server()!, user }))
			)[0]
		}));
	});

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
											if (member == undefined && server() != undefined) {
												return api.fetchMember({ server: server()!, user: author });
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
				{(attachments) => (
					<div class={styles.attachmentPreviewBase}>
						<div class={styles.attachmentPreview}>
							<For each={attachments()}>
								{(attachment, index) => (
									<AttachmentPreviewItem
										overlay={<FiXCircle size={30} />}
										metadata={{ name: attachment.name, size: attachment.size }}
										action={() => {
											setAttachments((attachments) => attachments.filter((_, i) => i != index()));
										}}
									>
										<Show
											when={attachment.type.startsWith('image/')}
											fallback={<AiFillFileText size={30} />}
										>
											<img src={URL.createObjectURL(attachment)} />
										</Show>
									</AttachmentPreviewItem>
								)}
							</For>
							<AttachmentPreviewItem action={pushFile}>
								<AiOutlinePlus size={24} />
							</AttachmentPreviewItem>
						</div>
						<hr />
					</div>
				)}
			</Show>
			<div class={styles.messageFormBase}>
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
					<TextAreaBase
						placeholder={
							channel?.channel_type == 'DirectMessage'
								? `Send message to ${channelName()}`
								: `Send message in ${channelName()}`
						}
						sendTypingIndicators
						ref={textbox!}
						onKeyDown={(event) => {
							if (event.shiftKey || event.key != 'Enter') {
								return;
							}

							event.preventDefault();
							event.currentTarget.form?.requestSubmit();
						}}
					/>
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

								const namesExceptLast = createMemo(() =>
									names()
										.slice(0, names().length - 1)
										.join(', ')
								);
								const lastName = createMemo(() => names()[names().length - 1]);

								return (
									<>
										{namesExceptLast()} and {lastName()} are typing...
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
