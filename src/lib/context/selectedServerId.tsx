import { useParams } from '@solidjs/router';
import { createContext, createMemo, type Accessor, type JSX } from 'solid-js';

export const SelectedServerIdContext = createContext<Accessor<string | undefined>>(() => undefined);

export interface Props {
	children: JSX.Element;
}

export default function SelectedServerIdProvider(props: Props) {
	const params = useParams();
	const selectedServerId = createMemo(() => params.sid);

	return (
		<SelectedServerIdContext.Provider value={selectedServerId}>
			{props.children}
		</SelectedServerIdContext.Provider>
	);
}
