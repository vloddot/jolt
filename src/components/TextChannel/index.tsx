import {
	For,
	Match,
	Switch,
	createResource,
	useContext,
	createSignal,
	Show,
	createMemo,
	type JSX,
	createComputed,
} from 'solid-js';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import api from '@lib/api';
import { MessageComponent } from './Message';
import RepliesProvider from './context/replies';
import TextAreaBase from './TextAreaBase';
import { ChannelContext as SelectedChannelContext } from './context/channel';
import util from '@lib/util';
import { MessageInputContext } from './context/messageInput';
import { MessageCollectionContext } from '@lib/context/collections/messages';
import { SelectedServerContext } from '@pages/(app)/servers/:sid/context';

export interface Props {
	channel: Exclude<Channel, { channel_type: 'VoiceChannel' }>;
	server?: Server;
}

export default function TextChannel(props: Props) {
	const [bulkMessageResponse, { refetch }] = createResource(
		(): [string, OptionsQueryMessages] => [
			props.channel._id,
			{
				sort: 'Latest',
				include_users: true
			}
		],
		api.queryMessages
	);

	return (
		<Switch>
			<Match when={bulkMessageResponse.state == 'errored'}>
				Error loading messages
				<button class={utilStyles.buttonPrimary} onClick={refetch}>
					Retry
				</button>
			</Match>
			<Match when={bulkMessageResponse.state == 'pending'}>Loading messages...</Match>
			<Match when={bulkMessageResponse.state == 'refreshing'}>Reloading messages...</Match>
			<Match when={bulkMessageResponse.state == 'unresolved'}>Unresolved channel.</Match>
			<Match when={bulkMessageResponse.state == 'ready' && bulkMessageResponse()}>
				{(response) => {
					return (
						<MessageInputContext.Provider value={MessageInputContext.defaultValue}>
							<SelectedChannelContext.Provider value={props.channel}>
								<RepliesProvider>
									<TextChannelMeta {...response()} />
								</RepliesProvider>
							</SelectedChannelContext.Provider>
						</MessageInputContext.Provider>
					);
				}}
			</Match>
		</Switch>
	);
}

export function TextChannelMeta(props: Awaited<ReturnType<typeof api.queryMessages>>) {
	// const [replies, { removeReply }] = useContext(RepliesContext)!;
	let textbox: HTMLTextAreaElement;
	const server = useContext(SelectedServerContext);
	const channel = useContext(SelectedChannelContext)!;
	const [, { initChannelCollection }] = useContext(MessageCollectionContext)!;

	const messageCollection = createMemo(() => initChannelCollection(channel._id, props, server));

	const [channelName, setChannelName] = createSignal('<Unknown Channel>');
	createComputed(() => {
		if (channel == undefined) {
			setChannelName('<Unknown Channel>');
			return;
		}

		if (channel.channel_type != 'SavedMessages' && channel.channel_type != 'DirectMessage') {
			setChannelName(`#${channel.name}`);
			return;
		}

		if (channel.channel_type == 'SavedMessages') {
			setChannelName('Saved Notes');
			return;
		}

		const recipient = util.getOtherRecipient(channel.recipients);
		if (recipient == undefined) {
			setChannelName('DM');
			return;
		}

		api.fetchUser(recipient).then((recipient) => setChannelName(`@${recipient.username}`));
	});

	const sendMessage: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
		event.preventDefault();
		if (channel == undefined) {
			return;
		}

		const data: DataMessageSend = {};

		const content = textbox.value.trim();
		if (content != '') {
			data.content = content;
			textbox.value = '';
		}

		api.sendMessage(channel?._id, data);
	};

	return (
		<>
			<div class={styles.messageList}>
				<For each={Array.from(messageCollection()().messages.values())}>
					{([message]) => {
						const author = messageCollection()().users.get(message.author);
						const member = messageCollection()().members.get(message.author);

						return (
							<Show when={author != undefined && ([author, member] as const)}>
								{(accessor) => {
									const [[author], member] = accessor();
									return (
										<MessageComponent
											message={message}
											author={author}
											member={member?.[0]}
											isHead={true}
										/>
									);
								}}
							</Show>
						);
					}}
				</For>
			</div>
			<div class={styles.messageFormBase}>
				<form class={styles.messageForm} onSubmit={sendMessage}>
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
			</div>
		</>
	);
}
