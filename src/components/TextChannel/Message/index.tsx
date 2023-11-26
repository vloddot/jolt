import util from '@lib/util';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import dayjs from '@lib/dayjs';
import { HiOutlinePencilSquare } from 'solid-icons/hi';
import { BsReply, BsTrash } from 'solid-icons/bs';
import { For, Show, type JSX, useContext, createMemo } from 'solid-js';
import { decodeTime } from 'ulid';
import { RepliesContext } from '../context/replies';
import 'tippy.js/animations/scale-subtle.css';
import Tooltip from '@components/Tooltip';
import api from '@lib/api';
import Attachment from './Attachment';
import Embed from './Embed';

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
	const [, { pushReply }] = useContext(RepliesContext)!;

	const messageControls: MessageControls[] = [
		{
			children: <BsReply size="18px" />,
			name: 'Reply',
			onclick: () => pushReply(props.message, true)
		},
		{
			children: <HiOutlinePencilSquare size="18px" />,
			name: 'Edit',
			onclick() {}
		},
		{
			children: <BsTrash size="18px" />,
			name: 'Delete',
			onclick() {
				api.deleteMessage(props.message.channel, props.message._id);
			}
		}
	];

	const displayName = createMemo(() =>
		util.getDisplayName(props.author, props.member, props.message)
	);

	return (
		<div class={styles.messageContainer}>
			<span style={{ width: '28px' }}>
				<Show when={props.isHead}>
					<img
						class={utilStyles.cover}
						src={util.getDisplayAvatar(props.author, props.member, props.message)}
						alt={displayName()}
						style={{ width: '28px', height: '28px' }}
					/>
				</Show>
			</span>
			<span class={styles.messageControls}>
				<For each={messageControls}>
					{({ children, name, onclick }) => {
						return (
							<Tooltip placement="top" content={name} animation="scale-subtle" duration={100}>
								<button class={utilStyles.buttonPrimary} onClick={onclick}>
									{children}
								</button>
							</Tooltip>
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
						<time class={styles.timestamp}>{dayjs(decodeTime(props.message._id)).calendar()}</time>
					</span>
				</Show>

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
	);
}
