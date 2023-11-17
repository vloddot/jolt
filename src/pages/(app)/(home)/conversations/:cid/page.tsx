import { SelectedChannelIdContext } from '@lib/context/selectedChannelId';
import { /* createResource, */ useContext } from 'solid-js';

export default function HomeChat() {
	const selectedChannelId = useContext(SelectedChannelIdContext)();

	if (selectedChannelId == undefined) {
		return <p>i think this is a bug</p>;
	}

	// const [channel] = createResource()
	return <div></div>;
}
