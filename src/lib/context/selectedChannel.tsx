import api from '@lib/api';
import { useParams } from '@solidjs/router';
import { createContext, type Accessor, type JSX, createResource, useContext } from 'solid-js';
import ClientContext from './client';

export const SelectedChannelContext = createContext<Accessor<Channel | undefined>>(() => undefined);

export interface Props {
	children: JSX.Element;
}

export default function SelectedChannelProvider(props: Props) {
	const client = useContext(ClientContext);

	const params = useParams();
	const [selectedChannel] = createResource(
		() => client.connectionState() == 'connected' && params.cid,
		api.fetchChannel
	);

	return (
		<SelectedChannelContext.Provider value={selectedChannel}>
			{props.children}
		</SelectedChannelContext.Provider>
	);
}
