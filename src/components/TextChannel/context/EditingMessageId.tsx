import { createContext, createSignal } from 'solid-js';

/**
 * The ID of the message currently being edited.
 */
// eslint-disable-next-line solid/reactivity
const EditingMessageIdContext = createContext(createSignal<string>());

export default EditingMessageIdContext;
