import { Client } from '@lib/Client';
import { createContext } from 'solid-js';

const ClientContext = createContext(new Client());

export default ClientContext;
