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
														messageData().author._id != lastMessage.author ||
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
