import {
	createContext,
	useContext,
	type JSX,
	batch,
	onCleanup,
	onMount
} from 'solid-js';
import ClientContext from '@lib/context/Client';
import { createStore } from 'solid-js/store';
import util from '@lib/util';
import type { ClientEvents } from '@lib/Client';
import { ReactiveMap } from '@solid-primitives/map';

export const MemberCollectionContext = createContext(
	new ReactiveMap<string, CollectionItem<Member>>()
);

interface Props {
	children: JSX.Element;
}

export default function MemberCollectionProvider(props: Props) {
	const members = MemberCollectionContext.defaultValue;
	const client = useContext(ClientContext);

	onMount(() => {
		const readyHandler: ClientEvents['Ready'] = ({ members: membersArray }) => {
			for (const member of membersArray) {
				const [store, setStore] = createStore(member);
				members.set(util.hashMemberId(member._id), [store, setStore]);
			}
		};

		const serverMemberUpdateHandler: ClientEvents['ServerMemberUpdate'] = (m) => {
			const member = members.get(util.hashMemberId(m.id));
			if (member == undefined) {
				return;
			}

			const [, setMember] = member;

			batch(() => {
				if (m.clear != undefined) {
					for (const clear of m.clear) {
						switch (clear) {
							case 'Nickname': {
								setMember('nickname', undefined);
								break;
							}
							case 'Avatar': {
								setMember('avatar', undefined);
								break;
							}
							case 'Roles': {
								setMember('roles', undefined);
								break;
							}
							case 'Timeout': {
								setMember('timeout', undefined);
								break;
							}
						}
					}
				}

				for (const [key, value] of Object.entries(m.data) as [keyof Member, never][]) {
					setMember(key, value);
				}
			});
		};

		client.on('Ready', readyHandler);
		client.on('ServerMemberUpdate', serverMemberUpdateHandler);

		onCleanup(() => {
			client.removeListener('Ready', readyHandler);
			client.removeListener('ServerMemberUpdate', serverMemberUpdateHandler);
		});
	});

	return (
		<MemberCollectionContext.Provider value={members}>
			{props.children}
		</MemberCollectionContext.Provider>
	);
}
