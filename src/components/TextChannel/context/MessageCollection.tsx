import type { MessageCollection } from '@lib/messageCollections';
import { createContext, type Accessor } from 'solid-js';

const MessageCollectionContext = createContext<Accessor<MessageCollection | undefined>>(
	() => undefined
);

export default MessageCollectionContext;
