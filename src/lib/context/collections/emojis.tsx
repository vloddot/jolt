import { createContext, createSignal, useContext, type JSX, type Accessor } from 'solid-js';
import ClientContext from '@lib/context/client';
import { createStore } from 'solid-js/store';

export type EmojiCollection = Map<Emoji['_id'], CollectionItem<Emoji>>;
export const EmojiCollectionContext = createContext<Accessor<EmojiCollection>>(() => new Map());

interface Props {
	children: JSX.Element;
}

export default function EmojiCollectionProvider(props: Props) {
	const [emojis, setEmojis] = createSignal<EmojiCollection>(EmojiCollectionContext.defaultValue());
	const client = useContext(ClientContext);

	client.on('Ready', ({ emojis }) => {
		setEmojis(new Map(emojis.map((emoji) => [emoji._id, createStore(emoji)])));
	});

	client.on('EmojiCreate', (emoji) => {
		setEmojis((emojis) => {
			emojis.set(emoji._id, createStore(emoji));
			return emojis;
		});
	});

	client.on('EmojiDelete', ({ id }) => {
		setEmojis((emojis) => {
			emojis.delete(id);
			return emojis;
		});
	});

	return (
		<EmojiCollectionContext.Provider value={emojis}>
			{props.children}
		</EmojiCollectionContext.Provider>
	);
}
