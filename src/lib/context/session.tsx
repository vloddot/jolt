import { createContext, createEffect, createSignal, useContext, type JSX, onMount } from 'solid-js';
import ClientContext from './client';
import localforage from 'localforage';

// eslint-disable-next-line solid/reactivity
export const SessionContext = createContext(createSignal<Session>());

export interface Props {
	children: JSX.Element;
}

export default function SessionProvider(props: Props) {
	const [session, setSession] = SessionContext.defaultValue;
	const client = useContext(ClientContext);

	createEffect(() => {
		const { token } = session() ?? { token: undefined };
		if (token != undefined) {
			client.authenticate(token);
		}
	});

	onMount(async () => {
		const session: Session | null = await localforage.getItem('session');
		if (session != undefined) {
			setSession(session);
		}
	});

	return (
		<SessionContext.Provider value={[session, setSession]}>
			{props.children}
		</SessionContext.Provider>
	);
}
