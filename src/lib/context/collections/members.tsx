import {
	createContext,
	createSignal,
	useContext,
	type JSX,
	batch,
	type Accessor,
	onCleanup,
	onMount
} from 'solid-js';
import ClientContext from '@lib/context/client';
import { createStore } from 'solid-js/store';
import util from '@lib/util';
import type { ClientEvents } from '@lib/client';

export type MemberCollection = Map<string, CollectionItem<Member>>;
export const MemberCollectionContext = createContext<Accessor<MemberCollection>>(() => new Map());

interface Props {
	children: JSX.Element;
}

export default function MemberCollectionProvider(props: Props) {
	const [members, setMembers] = createSignal<MemberCollection>(
		MemberCollectionContext.defaultValue()
	);
	const client = useContext(ClientContext);

	onMount(() => {
		const readyHandler: ClientEvents['Ready'] = ({ members }) => {
			setMembers(
				// eslint-disable-next-line solid/reactivity
				new Map(members.map((member) => [util.hashMemberId(member._id), createStore(member)]))
			);
		};

		const serverMemberUpdateHandler: ClientEvents['ServerMemberUpdate'] = (m) => {
			const member = members().get(util.hashMemberId(m.id));
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
