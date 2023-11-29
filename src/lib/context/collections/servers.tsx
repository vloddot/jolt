import {
	createContext,
	useContext,
	type JSX,
	batch,
	createSignal,
	type Accessor,
	onMount,
	onCleanup
} from 'solid-js';
import ClientContext from '@lib/context/client';
import { createStore } from 'solid-js/store';
import type { ClientEvents } from '@lib/client';

export type ServerCollection = Array<CollectionItem<Server>>;
export const ServerCollectionContext = createContext<Accessor<ServerCollection>>(() => []);

interface Props {
	children: JSX.Element;
}

export default function ServerCollectionProvider(props: Props) {
	const [servers, setServers] = createSignal<ServerCollection>(
		ServerCollectionContext.defaultValue()
	);
	const client = useContext(ClientContext);

	onMount(() => {
		const readyHandler: ClientEvents['Ready'] = ({ servers }) => {
			// eslint-disable-next-line solid/reactivity
			setServers(servers.map((server) => createStore(server)));
		};

		const serverCreateHandler: ClientEvents['ServerCreate'] = ({ server }) => {
			// eslint-disable-next-line solid/reactivity
			setServers((servers) => [...servers, createStore(server)]);
		};

		const serverDeleteHandler: ClientEvents['ServerDelete'] = ({ id }) => {
			setServers((servers) => servers.filter(([{ _id }]) => id != _id));
		};

		const serverUpdateHandler: ClientEvents['ServerUpdate'] = (m) => {
			const server = servers().find(([{ _id }]) => _id == m.id);
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
		};

		const serverRoleUpdateHandler: ClientEvents['ServerRoleUpdate'] = (m) => {
			const server = servers().find(([{ _id }]) => _id == m.id);
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
		};

		const serverRoleDeleteHandler: ClientEvents['ServerRoleDelete'] = (m) => {
			const server = servers().find(([{ _id }]) => _id == m.id);
			if (server == undefined) {
				return;
			}

			const [, setServer] = server;
			setServer((server) => {
				delete server.roles?.[m.role_id];
				return server;
			});
		};

		client.on('Ready', readyHandler);
		client.on('ServerCreate', serverCreateHandler);
		client.on('ServerDelete', serverDeleteHandler);
		client.on('ServerUpdate', serverUpdateHandler);
		client.on('ServerRoleUpdate', serverRoleUpdateHandler);
		client.on('ServerRoleDelete', serverRoleDeleteHandler);

		onCleanup(() => {
			client.removeListener('Ready', readyHandler);
			client.removeListener('ServerCreate', serverCreateHandler);
			client.removeListener('ServerDelete', serverDeleteHandler);
			client.removeListener('ServerUpdate', serverUpdateHandler);
			client.removeListener('ServerRoleUpdate', serverRoleUpdateHandler);
			client.removeListener('ServerRoleDelete', serverRoleDeleteHandler);
		});
	});

	return (
		<ServerCollectionContext.Provider value={servers}>
			{props.children}
		</ServerCollectionContext.Provider>
	);
}
