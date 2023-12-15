import ServerSidebarIcon from './ServerSidebarIcon';
import './layout.scss';
import styles from '@lib/util.module.scss';
import util from '@lib/util';
import {
	For,
	Match,
	Show,
	Switch,
	createMemo,
	createResource,
	createSelector,
	createSignal,
	onCleanup,
	onMount,
	useContext
} from 'solid-js';
import { Outlet, useLocation } from '@solidjs/router';
import ServerCollectionProvider, {
	ServerCollectionContext
} from '@lib/context/collections/Servers';
import SettingsProvider, { SettingsContext } from '@lib/context/Settings';
import SelectedServerIdProvider, { SelectedServerIdContext } from '@lib/context/SelectedServerId';
import UserCollectionProvider, { UserCollectionContext } from '@lib/context/collections/Users';
import ChannelCollectionProvider, {
	ChannelCollectionContext
} from '@lib/context/collections/Channels';
import MemberCollectionProvider from '@lib/context/collections/Members';
import EmojiCollectionProvider from '@lib/context/collections/Emojis';
import SelectedChannelIdProvider, {
	SelectedChannelIdContext
} from '@lib/context/SelectedChannelId';
import ClientContext from '@lib/context/Client';
import UnreadsCollectionProvider, {
	UnreadsCollectionContext
} from '@lib/context/collections/Unreads';
import { FaSolidHouse, FaSolidUserGroup } from 'solid-icons/fa';
import api from '@lib/api';
import UserAvatar from '@components/User/Avatar';
import { OcGear3 } from 'solid-icons/oc';
import { CgUser } from 'solid-icons/cg';
import UserProvider, { UserContext } from '@lib/context/User';

export default function AppWrapper() {
	const client = useContext(ClientContext);
	const [showContent, setShowContent] = createSignal(false);

	onMount(() => {
		function showContent() {
			setShowContent(true);
		}

		client.once('Ready', showContent);

		onCleanup(() => client.removeListener('Ready', showContent));
	});

	return (
		<ServerCollectionProvider>
			<UserCollectionProvider>
				<ChannelCollectionProvider>
					<MemberCollectionProvider>
						<EmojiCollectionProvider>
							<UnreadsCollectionProvider>
								<UserProvider>
									<SelectedServerIdProvider>
										<SelectedChannelIdProvider>
											<SettingsProvider>
												<Show when={showContent()} fallback={<p>Loading client...</p>}>
													<ServerSidebar />

													<Outlet />
												</Show>
											</SettingsProvider>
										</SelectedChannelIdProvider>
									</SelectedServerIdProvider>
								</UserProvider>
							</UnreadsCollectionProvider>
						</EmojiCollectionProvider>
					</MemberCollectionProvider>
				</ChannelCollectionProvider>
			</UserCollectionProvider>
		</ServerCollectionProvider>
	);
}

function ServerSidebar() {
	const { settings } = useContext(SettingsContext);
	const servers = useContext(ServerCollectionContext);
	const users = useContext(UserCollectionContext);
	const channels = useContext(ChannelCollectionContext);
	const selectedServerId = useContext(SelectedServerIdContext);
	const selectedChannelId = useContext(SelectedChannelIdContext);
	const serverIsSelected = createSelector(selectedServerId);
	const unreads = useContext(UnreadsCollectionContext);
	const user = useContext(UserContext);

	const location = useLocation();
	const unreadDms = createMemo(() =>
		Array.from(channels.values()).flatMap(([channel]) => {
			const unreadObject = unreads.get(channel._id)?.[0];
			if (unreadObject == undefined) {
				return [];
			}

			if (
				(channel.channel_type == 'Group' ||
					(channel.channel_type == 'DirectMessage' && channel.active)) &&
				util.isUnread(channel, unreadObject)
			) {
				return [channel];
			}

			return [];
		})
	);

	const sortedServers = createMemo(() => {
		if (
			settings.ordering.servers == undefined ||
			Object.keys(settings.ordering.servers).length == 0
		) {
			return Array.from(servers.values());
		}

		const ordering = Object.fromEntries(settings.ordering.servers.map((id, index) => [id, index]));

		return Array.from(servers.values()).sort(([a], [b]) => {
			const aIndex = ordering[a._id];
			const bIndex = ordering[b._id];

			// sort servers that don't exist in the ordering to the bottom
			if (aIndex == undefined) {
				return 1;
			}

			if (bIndex == undefined) {
				return -1;
			}

			// sort anything else by index
			return aIndex - bIndex;
		});
	});

	const incomingFriendRequestsCount = createMemo(
		() => Array.from(users.values()).filter(([user]) => user.relationship == 'Incoming').length
	);

	return (
		<div class="server-sidebar-container">
			<ServerSidebarIcon
				href="/"
				selected={
					['/', '/friends'].includes(location.pathname) ||
					(selectedServerId() == undefined && selectedChannelId() != undefined)
				}
				tooltip="Home"
				unread={false}
				mentions={incomingFriendRequestsCount()}
			>
				<Show when={user()} fallback={<FaSolidHouse />}>
					{(user) => <UserAvatar user={user()} width="42px" height="42px" presenceIndicatorHeight="14px" presenceIndicatorWidth="14px" />}
				</Show>
			</ServerSidebarIcon>

			<For each={unreadDms()}>
				{(channel) => {
					const unreadObject = createMemo(() => unreads.get(channel._id)?.[0]);
					const isUnread = createMemo(() => {
						const o = unreadObject();
						return o == undefined ? false : util.isUnread(channel, o);
					});

					const [recipient] = createResource<User | string, string>(
						() => util.getOtherRecipient(channel.recipients),
						(recipient) => {
							if (channel.channel_type == 'Group') {
								return channel.name;
							}

							return api.fetchUser(recipient);
						}
					);

					const tooltip = createMemo(() => {
						if (recipient.state == 'ready') {
							const result = recipient();
							if (typeof result == 'string') {
								return result;
							}

							return util.getDisplayName(result);
						}

						return '';
					});
					return (
						<ServerSidebarIcon
							href={`/conversations/${channel._id}`}
							unread={isUnread()}
							selected={false}
							mentions={unreadObject()?.mentions?.length}
							tooltip={tooltip()}
						>
							<Switch>
								<Match when={channel.channel_type == 'DirectMessage' && channel}>
									{(channel) => {
										const [recipient] = createResource(
											() => util.getOtherRecipient(channel().recipients),
											api.fetchUser
										);

										return (
											<Show when={recipient.state == 'ready' && recipient()}>
												{(recipient) => (
													<UserAvatar user={recipient()} width="42px" height="42px" />
												)}
											</Show>
										);
									}}
								</Match>
								<Match when={channel.channel_type == 'Group' && channel}>
									{(channel) => (
										<Show when={channel().icon} fallback={<FaSolidUserGroup size="28" />}>
											{(icon) => <img src={util.getAutumnURL(icon())} width="100%" height="100%" />}
										</Show>
									)}
								</Match>
							</Switch>
						</ServerSidebarIcon>
					);
				}}
			</For>

			<hr />

			<For each={sortedServers()}>
				{([server]) => {
					const channelCollection = useContext(ChannelCollectionContext);
					const channels = createMemo(() =>
						server.channels.flatMap((channel) => channelCollection.get(channel)?.[0] ?? [])
					);
					const [imageLoaded, setImageLoaded] = createSignal(true);

					const isUnread = createMemo(
						() =>
							channels()?.some((channel) => {
								const unreadObject = unreads.get(channel._id)?.[0];
								return unreadObject == undefined ? false : util.isUnread(channel, unreadObject);
							}) ?? false
					);

					const mentions = createMemo(
						() =>
							channels()?.reduce((acc, channel) => {
								const unreadObject = unreads.get(channel._id)?.[0];
								return acc + (unreadObject?.mentions?.length ?? 0);
							}, 0) ?? 0
					);

					return (
						<ServerSidebarIcon
							href={`/servers/${server._id}/channels/${server.channels[0]}`}
							selected={serverIsSelected(server._id)}
							tooltip={server.name}
							unread={isUnread()}
							mentions={mentions()}
						>
							<Show
								when={imageLoaded() && server.icon}
								fallback={server.name
									.split(' ')
									.slice(0, 5)
									.map((s) => s[0])
									.join('')}
							>
								{(icon) => (
									<img
										loading="lazy"
										onError={() => setImageLoaded(false)}
										class={styles.cover}
										src={util.getAutumnURL(icon())}
										alt={server.name}
									/>
								)}
							</Show>
						</ServerSidebarIcon>
					);
				}}
			</For>

			<div class={styles.flexDivider} />

			<ServerSidebarIcon
				href="/user"
				selected={location.pathname.startsWith('/user')}
				unread={false}
				tooltip="User Settings"
			>
				<CgUser />
			</ServerSidebarIcon>

			<ServerSidebarIcon
				href="/settings"
				selected={location.pathname.startsWith('/settings')}
				unread={false}
				tooltip="Settings"
			>
				<OcGear3 />
			</ServerSidebarIcon>
		</div>
	);
}
