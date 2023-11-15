import { Client } from '@lib/client';
import { createContext } from 'solid-js';

const ClientContext = createContext(new Client());

export default ClientContext;
