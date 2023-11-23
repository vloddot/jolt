import {
	For,
	Match,
	Switch,
	createResource,
	useContext,
	createSignal,
	Show,
	type JSX,
	createComputed
} from 'solid-js';
import styles from './index.module.scss';
import api from '@lib/api';
import { MessageComponent } from './Message';
import RepliesProvider from './context/replies';
import TextAreaBase from './TextAreaBase';
import { ChannelContext as SelectedChannelContext } from './context/channel';
import util from '@lib/util';
import { MessageInputContext } from './context/messageInput';
import { getMessageCollection, type MessageCollection } from '@lib/messageCollections';

export interface Props {
	channel: Exclude<Channel, { channel_type: 'VoiceChannel' }>;
	server?: Server;
}

export default function TextChannel(props: Props) {
	const [messageCollection] = createResource(
		[props.channel._id, props.server],
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
	// const [replies, { removeReply }] = useContext(RepliesContext)!;
	let textbox: HTMLTextAreaElement;
	const channel = useContext(SelectedChannelContext)!;

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
				<For each={Object.values(props.collection.messages)}>
					{(message) => {
						return (
							<Show when={message != undefined && message}>
								{(message) => {
									const author = props.collection.users[message().author];
									const member = props.collection.members[message().author];

									return (
										<Show when={author != undefined && ([author, member] as const)}>
											{(accessor) => {
												const [author, member] = accessor();
												return (
													<MessageComponent
														message={message()}
														author={author}
														member={member}
														isHead={true}
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
