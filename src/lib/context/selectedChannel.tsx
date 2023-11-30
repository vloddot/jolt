import api from '@lib/api';
import { useParams } from '@solidjs/router';
import { createContext, type Accessor, type JSX, createResource, useContext } from 'solid-js';
import { SessionContext } from './session';

export const SelectedChannelContext = createContext<Accessor<Channel | undefined>>(() => undefined);

export interface Props {
	children: JSX.Element;
}

export default function SelectedChannelProvider(props: Props) {
	const [session] = useContext(SessionContext);

	const params = useParams();
	const [selectedChannel] = createResource(
		() => [session(), params.cid] as const,
		([session, target]) => {
			if (session == undefined) {
				return;
			}

			return api.fetchChannel(target);
		}
	);

	return (
		<SelectedChannelContext.Provider value={selectedChannel}>
			{props.children}
		</SelectedChannelContext.Provider>
	);
}
