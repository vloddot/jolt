import { createContext, type Accessor } from 'solid-js';

export const SelectedChannelContext = createContext<Accessor<Channel | undefined>>(() => undefined);
