import {
	createContext,
	createSignal,
	useContext,
	type JSX,
	type Accessor,
	onMount,
	onCleanup
} from 'solid-js';
import ClientContext from '@lib/context/client';
import { createStore } from 'solid-js/store';
import type { ClientEvents } from '@lib/client';

export type EmojiCollection = Map<Emoji['_id'], CollectionItem<Emoji>>;
export const EmojiCollectionContext = createContext<Accessor<EmojiCollection>>(() => new Map());

interface Props {
	children: JSX.Element;
}

export default function EmojiCollectionProvider(props: Props) {
	const [emojis, setEmojis] = createSignal<EmojiCollection>(EmojiCollectionContext.defaultValue());
	const client = useContext(ClientContext);

	onMount(() => {
		const readyHandler: ClientEvents['Ready'] = ({ emojis }) => {
			// eslint-disable-next-line solid/reactivity
			setEmojis(new Map(emojis.map((emoji) => [emoji._id, createStore(emoji)])));
		};

		const emojiCreateHandler: ClientEvents['EmojiCreate'] = (emoji) => {
			setEmojis((emojis) => {
				// eslint-disable-next-line solid/reactivity
				emojis.set(emoji._id, createStore(emoji));
				return emojis;
			});
		};

		const emojiDeleteHandler: ClientEvents['EmojiDelete'] = ({ id }) => {
			setEmojis((emojis) => {
				emojis.delete(id);
				return emojis;
			});
		};

		client.on('Ready', readyHandler);
		client.on('EmojiCreate', emojiCreateHandler);
		client.on('EmojiDelete', emojiDeleteHandler);

		onCleanup(() => {
			client.removeListener('Ready', readyHandler);
			client.removeListener('EmojiCreate', emojiCreateHandler);
			client.removeListener('EmojiDelete', emojiDeleteHandler);
		});
	});

	return (
		<EmojiCollectionContext.Provider value={emojis}>
			{props.children}
		</EmojiCollectionContext.Provider>
	);
}
