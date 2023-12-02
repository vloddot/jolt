import {
	createContext,
	createEffect,
	createSignal,
	useContext,
	type JSX,
	onMount,
	onCleanup
} from 'solid-js';
import ClientContext from './Client';
import localforage from 'localforage';
import type { ClientEvents } from '@lib/Client';
import { useNavigate } from '@solidjs/router';

// eslint-disable-next-line solid/reactivity
export const SessionContext = createContext(createSignal<Session | undefined>());

export interface Props {
	children: JSX.Element;
}

export default function SessionProvider(props: Props) {
	const [session, setSession] = SessionContext.defaultValue;
	const client = useContext(ClientContext);
	const navigate = useNavigate();

	createEffect(() => {
		const s = session();
		if (s != undefined) {
			client.authenticate(s.token);
		}
	});

	onMount(async () => {
		const session: Session | null = await localforage.getItem('session');
		if (session != undefined) {
			setSession(session);
		}

		const notFoundHandler: ClientEvents['NotFound'] = async () => {
			setSession(undefined);
			await localforage.removeItem('session');
			navigate('/login', { replace: true });
		};

		client.on('NotFound', notFoundHandler);
		onCleanup(() => {
			client.removeListener('NotFound', notFoundHandler);
		});
	});

	return (
		<SessionContext.Provider value={[session, setSession]}>
			{props.children}
		</SessionContext.Provider>
	);
}
