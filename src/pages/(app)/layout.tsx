import { FaSolidHouse } from 'solid-icons/fa';
import ServerSidebarIcon from '@components/ServerSidebarIcon';
import './layout.scss';
import styles from '@lib/util.module.scss';
import util from '@lib/util';
import { Index, Show, createSelector, useContext } from 'solid-js';
import { Navigate, Outlet } from '@solidjs/router';
import { SessionContext } from '@lib/context/session';
import ServerCollectionProvider, {
	ServerCollectionContext
} from '@lib/context/collections/servers';
import SettingsProvider, { SettingsContext } from '@lib/context/settings';
import SelectedServerIdProvider, { SelectedServerIdContext } from '@lib/context/selectedServerId';
import UserCollectionProvider from '@lib/context/collections/users';
import ChannelCollectionProvider from '@lib/context/collections/channels';
import MemberCollectionProvider from '@lib/context/collections/members';
import EmojiCollectionProvider from '@lib/context/collections/emojis';
import SelectedChannelProvider from '@lib/context/selectedChannelId';

export default function AppWrapper() {
	return (
		<ServerCollectionProvider>
			<UserCollectionProvider>
				<ChannelCollectionProvider>
					<MemberCollectionProvider>
						<EmojiCollectionProvider>
							<SettingsProvider>
								<SelectedServerIdProvider>
									<SelectedChannelProvider>
										<ServerSidebar />

										<Outlet />
									</SelectedChannelProvider>
								</SelectedServerIdProvider>
							</SettingsProvider>
						</EmojiCollectionProvider>
					</MemberCollectionProvider>
				</ChannelCollectionProvider>
			</UserCollectionProvider>
		</ServerCollectionProvider>
	);
}

function ServerSidebar() {
	const session = useContext(SessionContext);
	const settings = useContext(SettingsContext);
	const servers = useContext(ServerCollectionContext);
	const selectedServerId = useContext(SelectedServerIdContext);
	const serverIsSelected = createSelector(selectedServerId);

	if (session == undefined) {
		return <Navigate href="/login" />;
	}

	return (
		<div class="server-sidebar-container">
			<ServerSidebarIcon href="/" selected={false} tooltip="Home">
				<FaSolidHouse />
			</ServerSidebarIcon>

			<hr />

			<Index
				each={Array.from(servers().values()).sort(([a], [b]) => {
					const aIndex = settings.ordering.servers?.indexOf(a._id) ?? 0;
					const bIndex = settings.ordering.servers?.indexOf(b._id) ?? 0;

					if (aIndex > bIndex) {
						return 1;
					}

					if (bIndex < aIndex) {
						return -1;
					}

					return 0;
				})}
			>
				{(serverAccessor) => {
					const [server] = serverAccessor();

					return (
						<ServerSidebarIcon
							href={`/servers/${server._id}`}
							selected={serverIsSelected(server._id)}
							tooltip={server.name}
						>
							<Show when={server.icon}>
								{(icon) => (
									<img class={styles.cover} src={util.getAutumnURL(icon())} alt={server.name} />
								)}
							</Show>
						</ServerSidebarIcon>
					);
				}}
			</Index>
		</div>
	);
}
