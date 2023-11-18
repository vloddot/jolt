import { createContext, useContext, type JSX, batch, createSignal, type Accessor } from 'solid-js';
import ClientContext from '@lib/context/client';
import { createStore } from 'solid-js/store';

export type ServerCollection = Map<Server['_id'], CollectionItem<Server>>;
export const ServerCollectionContext = createContext<Accessor<ServerCollection>>(() => new Map());

interface Props {
	children: JSX.Element;
}

export default function ServerCollectionProvider(props: Props) {
	const [servers, setServers] = createSignal<ServerCollection>(
		ServerCollectionContext.defaultValue()
	);
	const client = useContext(ClientContext);

	client.on('Ready', ({ servers }) => {
		setServers(new Map(servers.map((server) => [server._id, createStore(server)])));
	});

	client.on('ServerCreate', ({ server }) => {
		setServers((servers) => {
			servers.set(server._id, createStore(server));
			return servers;
		});
	});

	client.on('ServerDelete', ({ id }) => {
		setServers((servers) => {
			servers.delete(id);
			return servers;
		});
	});

	client.on('ServerUpdate', (m) => {
		const server = servers().get(m.id);
		if (server == undefined) {
			return;
		}

		const [, setServer] = server;

		batch(() => {
			if (m.clear != undefined) {
				for (const clear of m.clear) {
					swtch: switch (clear) {
						case 'Description':
							setServer('description', undefined);
							break swtch;
						case 'Icon':
							setServer('icon', undefined);
							break swtch;
						case 'Categories':
							setServer('categories', undefined);
							break swtch;
						case 'SystemMessages':
							setServer('system_messages', undefined);
							break swtch;
						case 'Banner':
							setServer('banner', undefined);
							break swtch;
					}
				}
			}

			for (const [key, value] of Object.entries(m.data)) {
				setServer(key as keyof Server, value as never);
			}
		});
	});

	client.on('ServerRoleUpdate', (m) => {
		const server = servers().get(m.id);
		if (server == undefined) {
			return;
		}

		const [, setServer] = server;

		setServer((server) => {
			if (server.roles != undefined) {
				for (const [key, role] of Object.entries(m.data)) {
					server.roles[m.role_id][key as keyof Role] = role as never;
				}
			}

			return server;
		});
	});

	client.on('ServerRoleDelete', (message) => {
		const s = servers().get(message.id);
		if (s == undefined) {
			return;
		}

		const [, setServer] = s;
		setServer((server) => {
			delete server.roles?.[message.role_id];
			return server;
		});
	});

	return (
		<ServerCollectionContext.Provider value={servers}>
			{props.children}
		</ServerCollectionContext.Provider>
	);
}
