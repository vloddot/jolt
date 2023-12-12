import styles from './index.module.scss';
import { UserCollectionContext } from '@lib/context/collections/Users';
import { createMemo, useContext } from 'solid-js';
import FriendsListCategory from './FriendsListCategory';

export default function Friends() {
	const users = useContext(UserCollectionContext);

	const userArray = createMemo(() => Array.from(users.values()).map(([user]) => user));
	const categories = createMemo(() => {
		const friends = {
			online: new Array<User>(),
			offline: new Array<User>()
		};

		const outgoing = new Array<User>();
		const incoming = new Array<User>();
		const blocked = new Array<User>();

		for (const user of userArray()) {
			switch (user.relationship) {
				case 'Friend': {
					friends[user.online ? 'online' : 'offline'].push(user);
					break;
				}
				case 'Outgoing': {
					outgoing.push(user);
					break;
				}
				case 'Incoming': {
					incoming.push(user);
					break;
				}
				case 'Blocked': {
					blocked.push(user);
					break;
				}
			}
		}

		return { friends, outgoing, incoming, blocked };
	});

	return (
		<div class={styles.friendsList}>
			<FriendsListCategory title="Incoming" list={categories().incoming} />
			<FriendsListCategory title="Outgoing" list={categories().outgoing} />
			<FriendsListCategory title="Online" list={categories().friends.online} />
			<FriendsListCategory title="Offline" list={categories().friends.offline} />
		</div>
	);
}
