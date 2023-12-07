import ServerSidebarIcon from '@components/ServerSidebarIcon';
import './layout.scss';
import styles from '@lib/util.module.scss';
import util from '@lib/util';
import {
	For,
	Show,
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
import UserCollectionProvider from '@lib/context/collections/Users';
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
import { FaSolidHouse } from 'solid-icons/fa';
import api from '@lib/api';
import UserAvatar from '@components/User/Avatar';
import { OcGear3 } from 'solid-icons/oc';
import settingsSections from './settings/sections';

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
							</UnreadsCollectionProvider>
						</EmojiCollectionProvider>
					</MemberCollectionProvider>
				</ChannelCollectionProvider>
			</UserCollectionProvider>
		</ServerCollectionProvider>
	);
}

function ServerSidebar() {
	const [settings] = useContext(SettingsContext);
	const servers = useContext(ServerCollectionContext);
	const channels = useContext(ChannelCollectionContext);
	const selectedServerId = useContext(SelectedServerIdContext);
	const selectedChannelId = useContext(SelectedChannelIdContext);
	const serverIsSelected = createSelector(selectedServerId);
	const unreads = useContext(UnreadsCollectionContext);

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
		const ordering = settings.ordering.servers;

		if (ordering == undefined || Object.keys(ordering).length == 0) {
			return Array.from(servers.values());
		}

		return Array.from(servers.values()).sort(([a], [b]) => {
			const aIndex = ordering.indexOf(a._id);
			const bIndex = ordering.indexOf(b._id);

			if (aIndex == -1) {
				return 1;
			}

			if (bIndex == -1) {
				return -1;
			}

			if (aIndex > bIndex) {
				return 1;
			}

			if (bIndex < aIndex) {
				return -1;
			}

			return 0;
		});
	});

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
			>
				<FaSolidHouse />
			</ServerSidebarIcon>

			<For each={unreadDms()}>
				{(dm) => {
					const unreadObject = createMemo(() => unreads.get(dm._id)?.[0]);
					const isUnread = createMemo(() => {
						const o = unreadObject();
						return o == undefined ? false : util.isUnread(dm, o);
					});

					const [recipient] = createResource(
						() => util.getOtherRecipient(dm.recipients),
						api.fetchUser
					);

					return (
						<Show when={recipient.state == 'ready' && recipient()}>
							{(recipient) => {
								const displayName = createMemo(() => util.getDisplayName(recipient()));

								return (
									<ServerSidebarIcon
										href={`/conversations/${dm._id}`}
										selected={false}
										tooltip={displayName()}
										unread={isUnread()}
										mentions={unreadObject()?.mentions?.length}
									>
										<UserAvatar user={recipient()} />
									</ServerSidebarIcon>
								);
							}}
						</Show>
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
								when={server.icon}
								fallback={server.name
									.split(' ')
									.slice(0, 5)
									.map((s) => s[0])
									.join('')}
							>
								{(icon) => (
									<img
										loading="lazy"
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
				href={`/settings/${Object.values(settingsSections)[0].id}`}
				selected={false}
				unread={false}
				tooltip="Settings"
			>
				<OcGear3 />
			</ServerSidebarIcon>
		</div>
	);
}
