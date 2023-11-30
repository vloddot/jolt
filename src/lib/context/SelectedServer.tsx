import { createContext, type Accessor } from 'solid-js';

export const SelectedServerContext = createContext<Accessor<Server | undefined>>(() => undefined);
