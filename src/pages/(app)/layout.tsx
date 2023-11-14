import { FaSolidHouse } from 'solid-icons/fa';
import ServerSidebarIcon from '@components/ServerSidebarIcon';
import './layout.scss';
import { For, Show, createSignal, useContext } from 'solid-js';
import { ClientContext } from '@lib/context/client';
import { Outlet } from '@solidjs/router';
import { getAutumnURL } from '@lib/util';

function AppWrapper() {
	const client = useContext(ClientContext);
	const [servers, setServers] = createSignal(Array.from(client.cache.servers.values()));

	client.on('Ready', () => {
		setServers(Array.from(client.cache.servers.values()));
	});

	return (
		<>
			<div class="server-sidebar-container">
				<ServerSidebarIcon href="/" selected={false} tooltip="Home">
					<FaSolidHouse />
				</ServerSidebarIcon>

				<hr />

				<For each={servers()}>
					{([server]) => (
						<ServerSidebarIcon
							href={`/servers/${server._id}`}
							selected={false}
							tooltip={server.name}
						>
							<Show when={server.icon}>
								{(icon) => <img class="cover" src={getAutumnURL(icon())} alt={server.name} />}
							</Show>
						</ServerSidebarIcon>
					)}
				</For>
			</div>

			<Outlet />
		</>
	);
}

export default AppWrapper;
