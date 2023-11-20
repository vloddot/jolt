import ServerSidebarIcon from '@components/ServerSidebarIcon';
import './layout.scss';
import styles from '@lib/util.module.scss';
import util from '@lib/util';
import { For, Show, createMemo, createSelector, useContext } from 'solid-js';
import { Outlet, useNavigate } from '@solidjs/router';
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
import ClientContext from '@lib/context/client';
import { FaSolidHouse } from 'solid-icons/fa';

export default function AppWrapper() {
	return (
		<ServerCollectionProvider>
			<UserCollectionProvider>
				<ChannelCollectionProvider>
					<MemberCollectionProvider>
						<EmojiCollectionProvider>
							<SelectedServerIdProvider>
								<SelectedChannelProvider>
									<SettingsProvider>
										<ServerSidebar />

										<Outlet />
									</SettingsProvider>
								</SelectedChannelProvider>
							</SelectedServerIdProvider>
						</EmojiCollectionProvider>
					</MemberCollectionProvider>
				</ChannelCollectionProvider>
			</UserCollectionProvider>
		</ServerCollectionProvider>
	);
}

function ServerSidebar() {
	const [session] = useContext(SessionContext);
	const client = useContext(ClientContext);
	const navigate = useNavigate();

	client.on('Ready', () => {
		if (session() == undefined) {
			navigate('/login', { replace: true });
		}
	});

	const settings = useContext(SettingsContext);
	const servers = useContext(ServerCollectionContext);
	const selectedServerId = useContext(SelectedServerIdContext);
	const serverIsSelected = createSelector(selectedServerId);

	const sortedServers = createMemo(() => {
		const {
			ordering: { servers: ordering }
		} = settings();
		if (ordering == undefined) {
			return Array.from(servers().values());
		}

		const result = Array.from(servers().values()).sort(([a], [b]) => {
			const aIndex = ordering.indexOf(a._id) ?? 0;
			const bIndex = ordering.indexOf(b._id) ?? 0;

			if (aIndex > bIndex) {
				return 1;
			}

			if (bIndex < aIndex) {
				return -1;
			}

			return 0;
		});

		return result;
	});

	return (
		<div class="server-sidebar-container">
			<ServerSidebarIcon href="/" selected={false} tooltip="Home">
				<FaSolidHouse />
			</ServerSidebarIcon>

			<hr />

			<For each={sortedServers()}>
				{([server]) => {
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
			</For>
		</div>
	);
}
