import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import { Show, createMemo, createResource, useContext } from 'solid-js';
import { RepliesContext, type SendableReply } from '../context/replies';
import api from '@lib/api';
import util from '@lib/util';
import { HiSolidAtSymbol } from 'solid-icons/hi';
import { BiSolidXCircle } from 'solid-icons/bi';
import type { SetStoreFunction } from 'solid-js/store';

export interface Props {
	reply: SendableReply;
	setReply: SetStoreFunction<SendableReply>;
}

export default function SendableReplyComponent(props: Props) {
	const [, setReplies] = useContext(RepliesContext);
	const [author] = createResource(() => props.reply.message.author, api.fetchUser);
	const displayName = createMemo(() =>
		author.state == 'ready' ? util.getDisplayName(author()) : '<Unknown User>'
	);
	const displayAvatar = createMemo(() =>
		author.state == 'ready'
			? util.getDisplayAvatar(author())
			: util.getDefaultUserAvatar(props.reply.message.author)
	);

	return (
		<div class={styles.replyContainer}>
			Replying to <img class={utilStyles.cover} src={displayAvatar()} width="16px" height="16px" />{' '}
			{displayName()}
			<Show when={props.reply.message.content}>
				{(content) => <span class={styles.messageContent}>{content()}</span>}
			</Show>
			<div class={utilStyles.flexDivider} />
			<label
				class={styles.replyButton}
				aria-label={`Mention author ${props.reply.mention ? 'ON' : 'OFF'}`}
			>
				<input
					style={{ display: 'none' }}
					type="checkbox"
					id="mention"
					checked={props.reply.mention}
					onInput={(event) => props.setReply('mention', event.currentTarget.checked)}
				/>
				<HiSolidAtSymbol size={20} />
				{props.reply.mention ? 'ON' : 'OFF'}
			</label>
			<button
				class={styles.replyButton}
				onClick={() =>
					// eslint-disable-next-line solid/reactivity
					setReplies((replies) =>
						replies.filter(
							([
								{
									message: { _id }
								}
							]) => _id != props.reply.message._id
						)
					)
				}
			>
				<BiSolidXCircle size={20} />
			</button>
		</div>
	);
}
