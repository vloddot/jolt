import { createContext, createSignal } from 'solid-js';

// eslint-disable-next-line solid/reactivity
export const MessageInputContext = createContext(createSignal(''));

