import type { JSX } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import ServersProvider from './servers';
import ChannelsProvider from './channels';
import UsersProvider from './users';
import MembersProvider from './members';
import EmojisProvider from './emojis';

export type CollectionItem<T> = [Store<T>, SetStoreFunction<T>];

export interface Props {
	children: JSX.Element;
}

export default function Collections(props: Props) {
	return (
		<ServersProvider>
			<ChannelsProvider>
				<UsersProvider>
					<MembersProvider>
						<EmojisProvider>{props.children}</EmojisProvider>
					</MembersProvider>
				</UsersProvider>
			</ChannelsProvider>
		</ServersProvider>
	);
}
