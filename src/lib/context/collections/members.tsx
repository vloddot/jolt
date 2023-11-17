import { createContext, createSignal, useContext, type JSX, batch, type Accessor } from 'solid-js';
import ClientContext from '@lib/context/client';
import type { CollectionItem } from '.';
import { createStore } from 'solid-js/store';

export type MemberCollection = Map<Member['_id'], CollectionItem<Member>>;
export const MemberCollectionContext = createContext<Accessor<MemberCollection>>(() => new Map());

interface Props {
	children: JSX.Element;
}

export default function MemberCollectionProvider(props: Props) {
	const [members, setMembers] = createSignal<MemberCollection>(
		MemberCollectionContext.defaultValue()
	);
	const client = useContext(ClientContext);

	client.on('Ready', ({ members }) => {
		setMembers(new Map(members.map((member) => [member._id, createStore(member)])));
	});

	client.on('ServerMemberUpdate', (m) => {
		const member = members().get(m.id);
		if (member == undefined) {
			return;
		}

		const [, setMember] = member;

		batch(() => {
			if (m.clear != undefined) {
				for (const clear of m.clear) {
					switch (clear) {
						case 'Nickname':
							setMember('nickname', undefined);
							break;
						case 'Avatar':
							setMember('avatar', undefined);
							break;
						case 'Roles':
							setMember('roles', undefined);
							break;
						case 'Timeout':
							setMember('timeout', undefined);
					}
				}
			}

			for (const [key, value] of Object.entries(m.data)) {
				setMember(key as keyof Member, value as never);
			}
		});
	});

	return (
		<MemberCollectionContext.Provider value={members}>
			{props.children}
		</MemberCollectionContext.Provider>
	);
}
