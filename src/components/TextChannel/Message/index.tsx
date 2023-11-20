import util from '@lib/util';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import { FaSolidPencil, FaSolidReply, FaSolidTrashCan } from 'solid-icons/fa';
import { For, Show, type JSX, useContext, createMemo } from 'solid-js';
import { decodeTime } from 'ulid';
import { RepliesContext } from '../context';

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
	dayjs.extend(calendar);

	const [, { pushReply }] = useContext(RepliesContext)!;

	const MESSAGE_CONTROLS: MessageControls[] = [
		{
			children: <FaSolidReply />,
			name: 'Reply',
			onclick: () => pushReply(props.message, true)
		},
		{
			children: <FaSolidPencil />,
			name: 'Edit',
			onclick() {}
		},
		{
			children: <FaSolidTrashCan />,
			name: 'Delete',
			onclick() {}
		}
	];

	const displayName = createMemo(() =>
		util.getDisplayName(props.author, props.member, props.message)
	);

	return (
		<div class={styles.messageContainer}>
			<Show when={props.isHead}>
				<img
					class={utilStyles.cover}
					src={util.getDisplayAvatar(props.author, props.member, props.message)}
					alt={displayName()}
					style={{ width: '28px', height: '28px' }}
				/>
			</Show>
			<div class={styles.messageControls}>
				<For each={MESSAGE_CONTROLS}>
					{({ children, onclick }) => {
						return (
							<button class={utilStyles.buttonPrimary} onClick={onclick}>
								{children}
							</button>
						);
					}}
				</For>
			</div>
			<div class={styles.messageBase}>
				<Show when={props.isHead}>
					<div class={styles.messageMeta}>
						<Show when={displayName() != props.author.username}>
							<span class={styles.displayName}>{displayName()}</span>
						</Show>
						<div class={styles.username}>
							@{props.author.username}#{props.author.discriminator}
						</div>
						<div class={styles.timestamp}>{dayjs(decodeTime(props.message._id)).calendar()}</div>
					</div>
				</Show>

				<span class={styles.messageContent}>{props.message.content}</span>
				<Show when={props.message.edited}>
					<span class={styles.editedText}>(edited)</span>
				</Show>
			</div>
		</div>
	);
}
