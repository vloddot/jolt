import util from '@lib/util';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import dayjs from '@lib/dayjs';
import { HiOutlinePencilSquare } from 'solid-icons/hi';
import { BsReply, BsTrash } from 'solid-icons/bs';
import { For, Show, type JSX, useContext, createMemo, createSignal, Match, Switch } from 'solid-js';
import { decodeTime } from 'ulid';
import { RepliesContext, type SendableReply } from '../context/Replies';
import 'tippy.js/animations/scale-subtle.css';
import Tooltip from '@components/Tooltip';
import api from '@lib/api';
import Attachment from './Attachment';
import Embed from './Embed';
import TextArea from '../TextArea';
import { SessionContext } from '@lib/context/Session';
import { createStore } from 'solid-js/store';
import MessageReply from './Reply';
import EditingMessageIdContext from '../context/EditingMessageId';
import Markdown from '@components/Markdown';
import UserAvatar from '@components/User/Avatar';
import { SettingsContext } from '@lib/context/Settings';
import { ServerCollectionContext } from '@lib/context/collections/Servers';

export interface Props {
	message: Message;
	author: User;
	member?: Member;
	isHead: boolean;
}

interface MessageControls {
	children: JSX.Element;
	name: string;
	showIf?: () => boolean;
	onclick: () => unknown;
}

export function MessageComponent(props: Props) {
	const [replies, setReplies] = useContext(RepliesContext)!;
	const [session] = useContext(SessionContext);
	const [editingMessageId, setEditingMessageId] = useContext(EditingMessageIdContext);
	const [settings] = useContext(SettingsContext);
	const serverCollection = useContext(ServerCollectionContext);

	const server = createMemo(() =>
		props.member == undefined ? undefined : serverCollection.get(props.member?._id.server)?.[0]
	);

	const displayName = createMemo(() =>
		util.getDisplayName(props.author, props.member, props.message)
	);

	const displayNameStyle = createMemo(() => {
		if (props.message.masquerade?.colour != undefined) {
			return util.getRoleColorStyle(props.message.masquerade.colour);
		}

		const s = server();
		if (props.member?.roles == undefined || s == undefined) {
			return {};
		}

		const color =
			util.sortRoles(s, props.member.roles).find((role) => role.colour != undefined)?.colour ??
			'inherit';

		return util.getRoleColorStyle(color);
	});

	const time = createMemo(() => dayjs(decodeTime(props.message._id)));

	const messageControls: MessageControls[] = [
		{
			children: <BsReply size="18px" />,
			name: 'Reply',
			onclick() {
				if (replies().length >= 5) {
					return;
				}

				const [store, setStore] = createStore<SendableReply>({
					message: props.message,
					mention: true
				});
				setReplies((replies) => [...replies, [store, setStore]]);
			}
		},
		{
			children: <HiOutlinePencilSquare size="18px" />,
			name: 'Edit',
			showIf: () => session()?.user_id == props.message.author,
			onclick: () => {
				return setEditingMessageId(
					editingMessageId() == props.message._id ? undefined : props.message._id
				);
			}
		},
		{
			children: <BsTrash size="18px" />,
			name: 'Delete',
			onclick: () => api.deleteMessage(props.message.channel, props.message._id)
		}
	];

	return (
		<div id={`MESSAGE-${props.message._id}`} classList={{ [styles.messageHead]: props.isHead }}>
			<Show when={props.message.replies?.length != 0 && props.message.replies}>
				{(replies) => (
					<div class={styles.replyBar}>
						<For each={replies()}>
							{(message_id) => <MessageReply to_id={message_id} from={props.message} />}
						</For>
					</div>
				)}
			</Show>
			<div class={styles.messageContainer}>
				<span class={styles.messageInfo}>
					<Switch fallback={<time>{time().format('HH:mm')}</time>}>
						<Match when={!props.isHead && props.message.edited}>
							{(time) => <EditedIndicator time={time()} />}
						</Match>
						<Match when={props.isHead}>
							<UserAvatar
								user={props.author}
								{...props}
								height="32px"
								width="32px"
								showPresence={settings['appearance:presence-icons']['messages']}
							/>
						</Match>
					</Switch>
				</span>
				<span class={styles.messageControls}>
					<For each={messageControls}>
						{({ children, name, onclick, showIf }) => {
							return (
								<Show when={showIf?.() ?? true}>
									<Tooltip placement="top" content={name} animation="scale-subtle" duration={100}>
										<button class={utilStyles.buttonPrimary} onClick={onclick}>
											{children}
										</button>
									</Tooltip>
								</Show>
							);
						}}
					</For>
				</span>
				<span class={styles.messageBase}>
					<Show when={props.isHead}>
						<span class={styles.messageMeta}>
							<span style={displayNameStyle()} class={styles.displayName}>
								{displayName()}
							</span>
							<Show when={displayName() != props.author.username}>
								<span class={styles.username}>
									@{props.author.username}#{props.author.discriminator}
								</span>
							</Show>
							<span>
								<time class={styles.timestamp}>{time().calendar()}</time>
								<Show when={props.message.edited}>
									{(time) => <EditedIndicator time={time()} />}
								</Show>
							</span>
						</span>
					</Show>

					<Switch>
						<Match when={editingMessageId() == props.message._id}>
							{/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
							{(_s) => {
								const [editedMessageInput, setEditedMessageInput] = createSignal<string>(
									props.message.content ?? ''
								);

								function editMessage() {
									api.editMessage(props.message.channel, props.message._id, {
										content: editedMessageInput()
									});

									setEditingMessageId(undefined);
								}

								return (
									<div class={styles.messageEditFormBase}>
										<form
											class={styles.messageEditForm}
											id="message-edit-form"
											onSubmit={(event) => {
												event.preventDefault();
												editMessage();
											}}
										>
											<TextArea
												placeholder="Edit message"
												initialValue={props.message.content}
												sendTypingIndicators={false}
												onInput={(event) => setEditedMessageInput(event.currentTarget.value)}
												onKeyDown={(event) => {
													if (event.key == 'Escape') {
														setEditingMessageId(undefined);
														return;
													}

													if (event.shiftKey || event.key != 'Enter') {
														return;
													}

													event.preventDefault();
													event.currentTarget.form?.requestSubmit();
												}}
											/>
										</form>
										<span class={styles.caption}>
											{'escape to '}
											<a
												style={{ cursor: 'pointer' }}
												role="button"
												onClick={() => setEditingMessageId(undefined)}
											>
												cancel
											</a>
											{' · enter to '}
											<a style={{ cursor: 'pointer' }} role="button" onClick={editMessage}>
												save
											</a>
										</span>
									</div>
								);
							}}
						</Match>
						<Match when={props.message.content}>
							{(content) => <Markdown>{content()}</Markdown>}
						</Match>
					</Switch>

					<Show when={props.message.attachments}>
						{(attachments) => (
							<For each={attachments()}>{(attachment) => <Attachment {...attachment} />}</For>
						)}
					</Show>

					<Show when={props.message.embeds}>
						{(embeds) => <For each={embeds()}>{(embed) => <Embed {...embed} />}</For>}
					</Show>
				</span>
			</div>
		</div>
	);
}

function EditedIndicator(props: { time: string }) {
	return (
		<Tooltip
			placement="top"
			content={dayjs(props.time).format('LLLL')}
			animation="scale-subtle"
			duration={100}
		>
			<span class={styles.editedIndicator}>(edited)</span>
		</Tooltip>
	);
}
