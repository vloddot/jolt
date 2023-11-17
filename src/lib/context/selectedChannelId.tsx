import { useParams } from '@solidjs/router';
import { createContext, createMemo, type Accessor, type JSX } from 'solid-js';

export const SelectedChannelIdContext = createContext<Accessor<string | undefined>>(
	() => undefined
);

export interface Props {
	children: JSX.Element;
}

export default function SelectedChannelProvider(props: Props) {
	const params = useParams();
	const selectedChannelId = createMemo<string | undefined>(() => params.cid);

	return (
		<SelectedChannelIdContext.Provider value={selectedChannelId}>
			{props.children}
		</SelectedChannelIdContext.Provider>
	);
}
