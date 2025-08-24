import { SettingsJson } from '@/renderer/components/views/settings/SettingsJson';
import { SettingsAbout } from '@/renderer/components/views/settings/about/SettingsAbout';
import { SettingsAppearance } from '@/renderer/components/views/settings/appearance/SettingsAppearance';
import {
	BellIcon,
	BlendingModeIcon,
	GearIcon,
	IdCardIcon,
	ImageIcon,
	KeyboardIcon,
	CodeIcon,
	FileTextIcon,
	ClockIcon,
} from '@radix-ui/react-icons';

import { SettingsApplication } from '@/renderer/components/views/settings/general/SettingsApplication';
import { SettingsKeyboard } from '@/renderer/components/views/settings/keyboard/SettingsKeyboard';
import { SettingsNotifications } from '@/renderer/components/views/settings/notifications/SettingsNotifications';

// API Client Components
import { RequestBuilder } from '@/renderer/components/views/apiClient/RequestBuilder';
import { Collections } from '@/renderer/components/views/apiClient/components/Collections';
import { History } from '@/renderer/components/views/apiClient/components/History';
import { ApiClientSettings } from '@/renderer/components/views/apiClient/components/ApiClientSettings';

export const nav = {
	home: {
		title: 'Home',
		href: '/',
	},
	settings: {
		title: 'Settings',
		href: '/settings',
	},
	apiClient: {
		title: 'API Client',
		href: '/apiClient',
	},
};

export const settingsNavItems = [
	{
		title: 'General',
		href: 'general',
		element: <SettingsApplication />,
		icon: GearIcon,
		index: true,
	},
	{
		title: 'Appearance',
		href: 'appearance',
		element: <SettingsAppearance />,
		icon: BlendingModeIcon,
	},

	{
		title: 'Notifications',
		href: 'notifications',
		element: <SettingsNotifications />,
		icon: BellIcon,
	},
	{
		title: 'Display',
		href: 'display',
		element: <SettingsJson />,
		icon: ImageIcon,
	},
	{
		title: 'Keyboard',
		href: 'keyboard',
		element: <SettingsKeyboard />,
		icon: KeyboardIcon,
	},
	{
		title: 'About',
		href: 'about',
		element: <SettingsAbout />,
		icon: IdCardIcon,
	},
];

// API Client navigation items
export const apiClientNavItems = [
	{
		title: 'Request Builder',
		href: '',
		element: <RequestBuilder />,
		icon: CodeIcon,
		index: true,
	},
	{
		title: 'Collections',
		href: 'collections',
		element: <Collections />,
		icon: FileTextIcon,
	},
	{
		title: 'History',
		href: 'history',
		element: <History />,
		icon: ClockIcon,
	},
	{
		title: 'Settings',
		href: 'settings',
		element: <ApiClientSettings />,
		icon: GearIcon,
	},
];
