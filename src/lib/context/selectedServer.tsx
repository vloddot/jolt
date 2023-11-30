import { useParams } from '@solidjs/router';
import {
	createContext,
	type Accessor,
	type JSX,
	createMemo,
	useContext,
	createEffect
} from 'solid-js';
import { ServerCollectionContext } from './collections/servers';
import ClientContext from './client';

export const SelectedServerContext = createContext<Accessor<Server | undefined>>(() => undefined);

export interface Props {
	children: JSX.Element;
}

export default function SelectedServerProvider(props: Props) {
	const client = useContext(ClientContext);
	const params = useParams();
	const servers = useContext(ServerCollectionContext);
	const selectedServer = createMemo(() =>
		client.connectionState() == 'connected' ? servers.get(params.sid)?.[0] : undefined
	);

	createEffect(() => {
		console.log(params.sid, selectedServer());
	});

	return (
		<SelectedServerContext.Provider value={selectedServer}>
			{props.children}
		</SelectedServerContext.Provider>
	);
}
