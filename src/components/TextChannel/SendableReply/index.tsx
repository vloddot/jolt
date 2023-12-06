import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import { Show, createMemo, createResource, useContext } from 'solid-js';
import { RepliesContext, type SendableReply } from '../context/Replies';
import api from '@lib/api';
import util from '@lib/util';
import { HiSolidAtSymbol } from 'solid-icons/hi';
import { BiSolidXCircle } from 'solid-icons/bi';
import type { SetStoreFunction } from 'solid-js/store';
import { SelectedServerIdContext } from '@lib/context/SelectedServerId';
import UserAvatar from '@components/User/Avatar';
import { SettingsContext } from '@lib/context/Settings';

export interface Props {
	reply: SendableReply;
	setReply: SetStoreFunction<SendableReply>;
}

export default function SendableReplyComponent(props: Props) {
	const [, setReplies] = useContext(RepliesContext);
	const selectedServerId = useContext(SelectedServerIdContext);
	const [settings] = useContext(SettingsContext);
	const [author] = createResource(() => props.reply.message.author, api.fetchUser);
	const [member] = createResource(() => {
		const server = selectedServerId();
		return server != undefined && { user: props.reply.message.author, server };
	}, api.fetchMember);

	const displayName = createMemo(() =>
		author.state == 'ready'
			? util.getDisplayName(author(), member(), props.reply.message)
			: '<Unknown User>'
	);

	return (
		<div class={styles.replyContainer}>
			Replying to
			<UserAvatar
				user={author() ?? props.reply.message.author}
				member={member()}
				message={props.reply.message}
				width="16px"
				height="16px"
				showPresence={settings['appearance:presence-icons']['reply-bar']}
				presenceIndicatorHeight="6px"
				presenceIndicatorWidth="6px"
			/>
			<span>{displayName()}</span>
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
				onClick={() => {
					const message_id = props.reply.message._id;
					setReplies((replies) => replies.filter(([reply]) => reply.message._id != message_id));
				}}
			>
				<BiSolidXCircle size={20} />
			</button>
		</div>
	);
}
