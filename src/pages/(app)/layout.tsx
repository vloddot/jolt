import { FaSolidHouse } from 'solid-icons/fa';
import ServerSidebarIcon from '@components/ServerSidebarIcon';
import './layout.scss';
import styles from '@lib/util.module.scss';
import util from '@lib/util';
import { Index, Show, useContext } from 'solid-js';
import { Navigate, Outlet } from '@solidjs/router';
import { SessionContext } from '@lib/context/session';
import { ServersContext } from '@lib/context/collections/servers';

export default function AppWrapper() {
	const session = useContext(SessionContext);
	const servers = useContext(ServersContext);

	if (session == undefined) {
		return <Navigate href="/login" />;
	}

	return (
		<>
			<div class="server-sidebar-container">
				<ServerSidebarIcon href="/" selected={false} tooltip="Home">
					<FaSolidHouse />
				</ServerSidebarIcon>

				<hr />

				<Index each={Array.from(servers().values())}>
					{(serverStore) => {
						const [server] = serverStore();

						return (
							<ServerSidebarIcon
								href={`/servers/${server._id}`}
								selected={false}
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

			<Outlet />
		</>
	);
}
