import util from '@lib/util';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import dayjs from '@lib/dayjs';
import { HiOutlinePencilSquare } from 'solid-icons/hi';
import { BsReply, BsTrash } from 'solid-icons/bs';
import {
	For,
	Show,
	type JSX,
	useContext,
	createMemo,
	createSignal,
	onMount,
	onCleanup
} from 'solid-js';
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
	const [editingMessage, setEditingMessage] = createSignal(false);

	const messageControls: MessageControls[] = [
		{
			children: <BsReply size="18px" />,
			name: 'Reply',
			onclick() {
				if (replies().length >= 5) {
					return;
				}

				// eslint-disable-next-line solid/reactivity
				setReplies((replies) => [
					...replies,
					// eslint-disable-next-line solid/reactivity
					createStore<SendableReply>({ message: props.message, mention: true })
				]);
			}
		},
		{
			children: <HiOutlinePencilSquare size="18px" />,
			name: 'Edit',
			showIf: () => session()?.user_id == props.message.author,
			onclick: () => setEditingMessage((editing) => !editing)
		},
		{
			children: <BsTrash size="18px" />,
			name: 'Delete',
			onclick: () => api.deleteMessage(props.message.channel, props.message._id)
		}
	];

	const displayName = createMemo(() =>
		util.getDisplayName(props.author, props.member, props.message)
	);

	const time = createMemo(() => dayjs(decodeTime(props.message._id)));

	return (
		<div id={`MESSAGE-${props.message._id}`}>
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
					<Show when={props.isHead} fallback={<time>{time().format('hh:mm')}</time>}>
						<img
							class={utilStyles.cover}
							src={util.getDisplayAvatar(props.author, props.member, props.message)}
							alt={displayName()}
							style={{ width: '32px', height: '32px' }}
						/>
					</Show>
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
							<span class={styles.displayName}>{displayName()}</span>
							<Show when={displayName() != props.author.username}>
								<span class={styles.username}>
									@{props.author.username}#{props.author.discriminator}
								</span>
							</Show>
							<time class={styles.timestamp}>{time().calendar()}</time>
						</span>
					</Show>

					<Show
						when={editingMessage()}
						fallback={
							<span class={styles.messageContent}>
								<span>{props.message.content}</span>
								<Show when={props.message.edited}>
									{(time) => {
										return (
											<Tooltip
												placement="top"
												content={dayjs(time()).format('LLLL')}
												animation="scale-subtle"
												duration={100}
											>
												<span class={styles.editedText}>(edited)</span>
											</Tooltip>
										);
									}}
								</Show>
							</span>
						}
					>
						{/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
						{(_s) => {
							const [editedMessageInput, setEditedMessageInput] = createSignal<string>(
								props.message.content ?? ''
							);

							let textarea: HTMLTextAreaElement;

							function focus() {
								if (!util.inputSelected()) {
									textarea.focus();
								}
							}

							onMount(() => {
								focus();
								document.addEventListener('keydown', focus);
								onCleanup(() => document.removeEventListener('keydown', focus));
							});

							function editMessage() {
								api.editMessage(props.message.channel, props.message._id, {
									content: editedMessageInput()
								});

								setEditingMessage(false);
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
											ref={textarea!}
											onInput={(event) => setEditedMessageInput(event.currentTarget.value)}
											onKeyDown={(event) => {
												if (event.key == 'Escape') {
													setEditingMessage(false);
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
											onClick={() => setEditingMessage(false)}
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
					</Show>

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
