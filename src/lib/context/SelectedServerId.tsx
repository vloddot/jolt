import { useParams } from '@solidjs/router';
import { createContext, type Accessor, type JSX, createMemo } from 'solid-js';

export const SelectedServerIdContext = createContext<Accessor<string | undefined>>(() => undefined);

export interface Props {
	children: JSX.Element;
}

export default function SelectedServerProvider(props: Props) {
	const params = useParams();
	const selectedServer = createMemo(() => params.sid);

	return (
		<SelectedServerIdContext.Provider value={selectedServer}>
			{props.children}
		</SelectedServerIdContext.Provider>
	);
}
