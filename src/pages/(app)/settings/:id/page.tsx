import type { Component } from 'solid-js';
import SettingsAppearance from '../appearance/page';
import { Dynamic } from 'solid-js/web';
import { useParams } from '@solidjs/router';

const sectionMapping: Record<string, Component> = {
	appearance: SettingsAppearance
};

export default function SettingsSection() {
	const params = useParams();
	return <Dynamic component={sectionMapping[params.id]} />;
}
