import { useParams } from '@solidjs/router';
import { createContext, type Accessor, type JSX } from 'solid-js';

export const SelectedChannelIdContext = createContext<Accessor<string | undefined>>(
	() => undefined
);

export interface Props {
	children: JSX.Element;
}

export default function SelectedChannelIdProvider(props: Props) {
	const params = useParams();
	const selectedChannelId = () => params.cid;

	return (
		<SelectedChannelIdContext.Provider value={selectedChannelId}>
			{props.children}
		</SelectedChannelIdContext.Provider>
	);
}
