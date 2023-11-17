import ChannelItem from '@components/Channel/ChannelItem';
import { Outlet, useLocation } from '@solidjs/router';
import {
	FaRegularCircleUser,
	FaSolidHouse,
	FaSolidNoteSticky,
	FaSolidUserGroup
} from 'solid-icons/fa';
import { For, Match, Show, Switch, createResource, createSelector, useContext } from 'solid-js';
import styles from '@lib/util.module.scss';
import util from '@lib/util';
import api from '@lib/api';
import ClientContext from '@lib/context/client';
import { SelectedChannelIdContext } from '@lib/context/selectedChannelId';

export default function HomeWrapper() {
	const location = useLocation();
	const client = useContext(ClientContext);
	const selectedChannelId = useContext(SelectedChannelIdContext);
	const channelIsSelected = createSelector(selectedChannelId);

	const [channels] = createResource(() => client.connectionState() == 'connected', api.fetchDMs);

	return (
		<>
			<div class="channel-bar-container">
				<ChannelItem href="/" selected={location.pathname == '/'} unread={false}>
					<FaSolidHouse />

					<span>Home</span>
				</ChannelItem>
				<ChannelItem href="/friends" selected={location.pathname == '/friends'} unread={false}>
					<FaRegularCircleUser />

					<span>Friends (placeholder)</span>
				</ChannelItem>
				<For
					each={channels()?.sort((a, b) => {
						if (a.channel_type == 'SavedMessages') {
							return -1;
						}

						if (b.channel_type == 'SavedMessages') {
							return 1;
						}

						return b.last_message_id?.localeCompare(a.last_message_id ?? '0') ?? 0;
					})}
				>
					{(channel) => {
						if (channel.channel_type == 'SavedMessages') {
							return (
								<>
									<ChannelItem
										href={`/conversations/${channel._id}`}
										selected={channelIsSelected(channel._id)}
										unread={false}
									>
										<FaSolidNoteSticky />

										<span>Saved Messages</span>
									</ChannelItem>
									<hr />
								</>
							);
						}

						return (
							<Switch>
								<Match when={channel.channel_type == 'Group' ? channel : false}>
									{(channelAccessor) => {
										const { name, icon } = channelAccessor();
										return (
											<ChannelItem
												href={`/conversations/${channel._id}`}
												selected={channelIsSelected(channel._id)}
												unread={false}
											>
												<Show when={icon} fallback={<FaSolidUserGroup />}>
													{(icon) => <img src={util.getAutumnURL(icon())} alt={name} />}
												</Show>
												<span>{name}</span>
											</ChannelItem>
										);
									}}
								</Match>
								<Match
									when={channel.channel_type == 'DirectMessage' && channel.active ? channel : false}
								>
									{(channelAccessor) => {
										const channel = channelAccessor();
										const [recipient] = createResource(
											util.getOtherRecipient(channel.recipients),
											api.fetchUser
										);

										return (
											<ChannelItem
												href={`/conversations/${channel._id}`}
												selected={channelIsSelected(channel._id)}
												unread={false}
											>
												<Switch>
													<Match when={recipient.state == 'pending'}>Loading user...</Match>
													<Match
														when={recipient.state == 'unresolved' || recipient.state == 'errored'}
													>
														Could not resolve user.
													</Match>
													<Match when={recipient.state == 'refreshing'}>Reloading user...</Match>
													<Match when={recipient.state == 'ready' ? recipient()! : false}>
														{(recipientAccessor) => {
															const recipient = recipientAccessor();
															const name = util.getDisplayName(recipient);
															const avatar = util.getDisplayAvatar(recipient);
															return (
																<>
																	<img class={styles.cover} src={avatar} alt={name} />
																	<span>{name}</span>
																</>
															);
														}}
													</Match>
												</Switch>
											</ChannelItem>
										);
									}}
								</Match>
							</Switch>
						);
					}}
				</For>
			</div>

			<Outlet />
		</>
	);
}
