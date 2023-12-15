import {
	createContext,
	createMemo,
	useContext,
	type JSX,
	type Accessor,
	createEffect
} from 'solid-js';
import { UserCollectionContext } from './collections/Users';
import { SessionContext } from './Session';

export const UserContext = createContext<Accessor<User | undefined>>(() => undefined);

export interface Props {
	children: JSX.Element;
}

export default function UserProvider(props: Props) {
	const userCollection = useContext(UserCollectionContext);
	const [session] = useContext(SessionContext);

	const user = createMemo(() => {
		const s = session();
		if (s == undefined) {
			return;
		}

		return userCollection.get(s.user_id)?.[0];
	});

	createEffect(() => console.log(user()));

	return <UserContext.Provider value={user}>{props.children}</UserContext.Provider>;
}
