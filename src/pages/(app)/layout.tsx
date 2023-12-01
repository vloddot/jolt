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
import UnreadsCollectionProvider from '@lib/context/collections/Unreads';
import { FaSolidHouse } from 'solid-icons/fa';
import api from '@lib/api';

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
	const settings = useContext(SettingsContext);
	const servers = useContext(ServerCollectionContext);
	const channels = useContext(ChannelCollectionContext);
	const selectedServerId = useContext(SelectedServerIdContext);
	const selectedChannelId = useContext(SelectedChannelIdContext);
	const serverIsSelected = createSelector(selectedServerId);
	const location = useLocation();
	const unreadDms = createMemo(() =>
		Array.from(channels.values()).flatMap(([channel]) => {
			if (
				((channel.channel_type == 'DirectMessage' && channel.active) ||
					channel.channel_type == 'Group') &&
				util.isUnread(channel)
			) {
				return [channel];
			}

			return [];
		})
	);

	const sortedServers = createMemo(() => {
		const {
			ordering: { servers: ordering }
		} = settings();

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
					const [recipient] = createResource(
						() => util.getOtherRecipient(dm.recipients),
						api.fetchUser
					);

					return (
						<Show when={recipient.state == 'ready' && recipient()}>
							{(recipient) => {
								const displayName = createMemo(() => util.getDisplayName(recipient()));
								const displayAvatar = createMemo(() => util.getDisplayAvatar(recipient()));

								return (
									<ServerSidebarIcon
										href={`/conversations/${dm._id}`}
										selected={false}
										tooltip={displayName()}
										unread={true}
									>
										<img class={styles.cover} src={displayAvatar()} alt={displayName()} />
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
						() => channels()?.some((channel) => util.isUnread(channel)) ?? false
					);

					return (
						<ServerSidebarIcon
							href={`/servers/${server._id}/channels/${server.channels[0]}`}
							selected={serverIsSelected(server._id)}
							tooltip={server.name}
							unread={isUnread()}
						>
							<Show
								when={server.icon}
								fallback={server.name
									.split(' ')
									.map((s) => s[0])
									.slice(0, 5)
									.join('')}
							>
								{(icon) => (
									<img class={styles.cover} src={util.getAutumnURL(icon())} alt={server.name} />
								)}
							</Show>
						</ServerSidebarIcon>
					);
				}}
			</For>
		</div>
	);
}
