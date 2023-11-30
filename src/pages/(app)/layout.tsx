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
} from '@lib/context/collections/servers';
import SettingsProvider, { SettingsContext } from '@lib/context/settings';
import SelectedServerProvider, { SelectedServerContext } from '@lib/context/selectedServer';
import UserCollectionProvider from '@lib/context/collections/users';
import ChannelCollectionProvider from '@lib/context/collections/channels';
import MemberCollectionProvider from '@lib/context/collections/members';
import EmojiCollectionProvider from '@lib/context/collections/emojis';
import SelectedChannelProvider, { SelectedChannelContext } from '@lib/context/selectedChannel';
import ClientContext from '@lib/context/client';
import { FaSolidHouse } from 'solid-icons/fa';
import UnreadsCollectionProvider from '@lib/context/collections/unreads';
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
								<SelectedServerProvider>
									<SelectedChannelProvider>
										<SettingsProvider>
											<Show when={showContent()} fallback={<p>Loading client...</p>}>
												<ServerSidebar />

												<Outlet />
											</Show>
										</SettingsProvider>
									</SelectedChannelProvider>
								</SelectedServerProvider>
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
	const selectedServer = useContext(SelectedServerContext);
	const selectedChannel = useContext(SelectedChannelContext);
	const serverIsSelected = createSelector(() => selectedServer()?._id);
	const location = useLocation();

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
					(selectedServer() == undefined && selectedChannel() != undefined)
				}
				tooltip="Home"
				unread={false}
			>
				<FaSolidHouse />
			</ServerSidebarIcon>

			<hr />

			<For each={sortedServers()}>
				{([server]) => {
					const [channels] = createResource(
						() => server.channels,
						async (channels) => await Promise.all(channels.map(api.fetchChannel))
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
