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

	onMount(async () => {
		const storageSession: Session | null = await localforage.getItem('session');
		if (storageSession != undefined) {
			setSession(storageSession);
		}

		const notFoundHandler: ClientEvents['NotFound'] = async () => {
			setSession(undefined);
			await localforage.removeItem('session');
		};

		client.on('NotFound', notFoundHandler);
		onCleanup(() => {
			client.removeListener('NotFound', notFoundHandler);
		});

		createEffect(() => {
			const s = session();
			if (s == undefined) {
				navigate('/login', { replace: true });
			} else {
				client.authenticate(s.token);
			}
		});
	});

	return (
		<SessionContext.Provider value={[session, setSession]}>
			{props.children}
		</SessionContext.Provider>
	);
}
