import { createContext, useContext, type JSX, onMount, onCleanup } from 'solid-js';
import ClientContext from '@lib/context/Client';
import { createStore } from 'solid-js/store';
import type { ClientEvents } from '@lib/Client';
import { ReactiveMap } from '@solid-primitives/map';

export const EmojiCollectionContext = createContext(
	new ReactiveMap<Emoji['_id'], CollectionItem<Emoji>>()
);

interface Props {
	children: JSX.Element;
}

export default function EmojiCollectionProvider(props: Props) {
	const emojis = EmojiCollectionContext.defaultValue;
	const client = useContext(ClientContext);

	onMount(() => {
		const readyHandler: ClientEvents['Ready'] = ({ emojis: emojisArray }) => {
			for (const emoji of emojisArray) {
				const [store, setStore] = createStore(emoji);
				emojis.set(emoji._id, [store, setStore]);
			}
		};

		const emojiCreateHandler: ClientEvents['EmojiCreate'] = (emoji) => {
			const [store, setStore] = createStore(emoji);
			emojis.set(emoji._id, [store, setStore]);
		};

		const emojiDeleteHandler: ClientEvents['EmojiDelete'] = ({ id }) => {
			emojis.delete(id);
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
