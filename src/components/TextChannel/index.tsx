import {
	For,
	Match,
	Switch,
	createResource,
	useContext,
	type ResourceReturn,
	createSignal,
	Show,
	type Resource
} from 'solid-js';
import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import api from '@lib/api';
import { UserCollectionContext } from '@lib/context/collections/users';
import { MemberCollectionContext } from '@lib/context/collections/members';
import ClientContext from '@lib/context/client';
import util from '@lib/util';

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
			<Match when={bulkMessageResponse.state == 'ready' ? bulkMessageResponse() : false}>
				{(responseAccessor) => {
					const userCollection = useContext(UserCollectionContext);
					const memberCollection = useContext(MemberCollectionContext);
					const client = useContext(ClientContext);

					const response = responseAccessor();
					const [messages, setMessages] = createSignal(response.messages.reverse());

					client.on('Message', (message) => {
						if (message.channel == props.channel._id) {
							setMessages([...messages(), message]);
						}
					});

					const { users: usersArray, members: membersArray } = responseAccessor();
					const users = new Map<string, ResourceReturn<User>>(
						usersArray.map(({ _id: id }) => {
							const item = userCollection().get(id);
							if (item == undefined) {
								return [id, createResource(() => api.fetchUser(id))];
							}

							const [user] = item;
							return [user._id, createResource(() => user)];
						})
					);

					const members = new Map<string, ResourceReturn<Member>>(
						membersArray?.map(({ _id: id }) => {
							const item = memberCollection().get(id);
							if (item == undefined) {
								return [id.user, createResource(() => api.fetchMember(id))];
							}

							const [member] = item;
							return [member._id.user, createResource(() => member)];
						})
					);

					return (
						<div class={styles.messageList}>
							<For each={messages()}>
								{(message) => {
									const [author] =
										users.get(message.author) ??
										createResource(() => api.fetchUser(message.author));

									let member: Resource<Member> | undefined = undefined;
									if (props.server != undefined) {
										const key: MemberCompositeKey = {
											server: props.server._id,
											user: message.author
										};
										[member] = members.get(key.user) ?? createResource(() => api.fetchMember(key));
									}

									return (
										<Show
											when={
												author.state == 'ready' && (member == undefined || member.state == 'ready')
													? ([author, member] as const)
													: false
											}
										>
											{(accessor) => {
												const [author, member] = accessor();
												return (
													<MessageComponent
														message={message}
														author={author()}
														member={member?.()}
													/>
												);
											}}
										</Show>
									);
								}}
							</For>
						</div>
					);
				}}
			</Match>
		</Switch>
	);
}

export interface MessageProps {
	message: Message;
	author: User;
	member?: Member;
}

export function MessageComponent(props: MessageProps) {
	return (
		<div class={styles.messageContainer}>
			<img
				class={utilStyles.cover}
				src={util.getDisplayAvatar(props.author, props.member, props.message)}
				alt={util.getDisplayName(props.author, props.member, props.message)}
			/>
			{props.message.content}
		</div>
	);
}
