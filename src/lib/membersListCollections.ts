import { createRoot, onCleanup, onMount, useContext } from 'solid-js';
import api from './api';
import ClientContext from './context/Client';
import type { ClientEvents } from './Client';
import { ReactiveMap } from '@solid-primitives/map';

interface MembersListCollection {
	members: ReactiveMap<Member['_id']['user'], Member>;
	users: ReactiveMap<User['_id'], User>;
}

const collections: Record<string, MembersListCollection> = {};

export async function getMembersListCollection(server_id: string): Promise<MembersListCollection> {
	let collection = collections[server_id];
	if (!collection) {
		const response = await api.fetchMembers(server_id);
		const client = useContext(ClientContext);

		collection = createRoot(() => {
			onMount(() => {
				const serverMemberJoinHandler: ClientEvents['ServerMemberJoin'] = async (message) => {
					if (message.id != server_id) {
						return;
					}

					response.members.set(
						message.user,
						await api.fetchMember({ server: server_id, user: message.user })
					);
					response.users.set(message.user, await api.fetchUser(message.user));
				};

				const serverMemberLeaveHandler: ClientEvents['ServerMemberLeave'] = async (message) => {
					if (message.id != server_id) {
						return;
					}

					response.members.delete(message.user);
					response.users.delete(message.user);
				};

				client.on('ServerMemberJoin', serverMemberJoinHandler);
				client.on('ServerMemberLeave', serverMemberLeaveHandler);

				onCleanup(() => {
					client.removeListener('ServerMemberJoin', serverMemberJoinHandler);
					client.removeListener('ServerMemberLeave', serverMemberLeaveHandler);
				});
			});

			return {
				...response
			};
		});

		collections[server_id] = collection;
	}

	return collection;
}
