import ChannelItem from '@components/ChannelItem';
import { Outlet, useLocation } from '@solidjs/router';
import {
	FaRegularCircleUser,
	FaSolidHouse,
	FaSolidNoteSticky,
	FaSolidUserGroup
} from 'solid-icons/fa';
import {
	For,
	Match,
	Show,
	Switch,
	createMemo,
	createResource,
	createSelector,
	useContext
} from 'solid-js';
import util from '@lib/util';
import api from '@lib/api';
import { ChannelCollectionContext } from '@lib/context/collections/Channels';
import { SelectedChannelIdContext } from '@lib/context/SelectedChannelId';
import { UnreadsCollectionContext } from '@lib/context/collections/Unreads';
import UserButton from '@components/User/Button';
import { SettingsContext } from '@lib/context/Settings';
import { UserCollectionContext } from '@lib/context/collections/Users';

export default function HomeWrapper() {
	const location = useLocation();
	const channelCollection = useContext(ChannelCollectionContext);
	const userCollection = useContext(UserCollectionContext);
	const selectedChannelId = useContext(SelectedChannelIdContext);
	const channelIsSelected = createSelector(selectedChannelId);
	const unreads = useContext(UnreadsCollectionContext);

	const channels = createMemo(() => {
		return (
			Array.from(channelCollection.values()).filter((accessor) => {
				const [channel] = accessor;

				return channel.channel_type != 'TextChannel' && channel.channel_type != 'VoiceChannel';
			}) as CollectionItem<Exclude<Channel, { channel_type: 'TextChannel' | 'VoiceChannel' }>>[]
		).sort(([a], [b]) => {
			if (a.channel_type == 'SavedMessages') {
				return -1;
			}

			if (b.channel_type == 'SavedMessages') {
				return 1;
			}

			if (a.last_message_id == undefined && b.last_message_id == undefined) {
				return 0;
			}

			return (b.last_message_id ?? '0').localeCompare(a.last_message_id ?? '0');
		});
	});

	const incomingFriendRequestsCount = createMemo(
		() =>
			Array.from(userCollection.values()).filter(([user]) => user.relationship == 'Incoming').length
	);

	return (
		<>
			<div class="channel-bar-container">
				<ChannelItem href="/" selected={location.pathname == '/'} unread={false}>
					<FaSolidHouse />

					<span>Home</span>
				</ChannelItem>
				<ChannelItem
					href="/friends"
					selected={location.pathname == '/friends'}
					unread={false}
					mentions={incomingFriendRequestsCount()}
				>
					<FaRegularCircleUser />

					<span>Friends</span>
				</ChannelItem>
				<For each={channels()}>
					{([channel]) => {
						const unreadObject = createMemo(() => unreads.get(channel._id)?.[0]);
						const isUnread = createMemo(() => {
							const unread = unreadObject();

							return unread != undefined && util.isUnread(channel, unread);
						});

						return (
							<Switch>
								<Match when={channel.channel_type == 'SavedMessages'}>
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
								</Match>
								<Match when={channel.channel_type == 'Group' && channel}>
									{(channel) => {
										return (
											<ChannelItem
												href={`/conversations/${channel()._id}`}
												selected={channelIsSelected(channel()._id)}
												unread={isUnread()}
												mentions={unreadObject()?.mentions?.length}
											>
												<Show when={channel().icon} fallback={<FaSolidUserGroup />}>
													{(icon) => (
														<img
															loading="lazy"
															src={util.getAutumnURL(icon())}
															alt={channel().name}
														/>
													)}
												</Show>
												<span>{channel().name}</span>
											</ChannelItem>
										);
									}}
								</Match>
								<Match when={channel.channel_type == 'DirectMessage' && channel.active && channel}>
									{(channel) => {
										const { settings } = useContext(SettingsContext);
										const [recipient] = createResource(
											() => util.getOtherRecipient(channel().recipients),
											api.fetchUser
										);

										return (
											<ChannelItem
												href={`/conversations/${channel()._id}`}
												selected={channelIsSelected(channel()._id)}
												unread={isUnread()}
												mentions={unreadObject()?.mentions?.length}
											>
												<Switch>
													<Match when={recipient.state == 'pending'}>Loading user...</Match>
													<Match
														when={recipient.state == 'unresolved' || recipient.state == 'errored'}
													>
														Could not resolve user.
													</Match>
													<Match when={recipient.state == 'refreshing'}>Reloading user...</Match>
													<Match when={recipient.state == 'ready' && recipient()}>
														{(recipient) => {
															return (
																<UserButton
																	user={recipient()}
																	showPresence={settings['appearance:presence-icons']['dms']}
																/>
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

			<main class="main-content-container">
				<Outlet />
			</main>
		</>
	);
}
