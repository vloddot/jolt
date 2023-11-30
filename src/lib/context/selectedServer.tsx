import { useParams } from '@solidjs/router';
import { createContext, type Accessor, type JSX, createMemo, useContext } from 'solid-js';
import { ServerCollectionContext } from './collections/servers';

export const SelectedServerContext = createContext<Accessor<Server | undefined>>(
	() => undefined
);

export interface Props {
	children: JSX.Element;
}

export default function SelectedServerProvider(props: Props) {
	const params = useParams();
	const servers = useContext(ServerCollectionContext);
	const selectedServer = createMemo(() => servers.get(params.sid)?.[0]);

	return (
		<SelectedServerContext.Provider value={selectedServer}>
			{props.children}
		</SelectedServerContext.Provider>
	);
}
