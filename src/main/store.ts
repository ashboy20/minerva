import { CustomAcceleratorsType } from '@/types/keyboard';
import Store from 'electron-store';
import {
	DEFAULT_KEYBINDS,
	DEFAULT_SETTINGS,
	SettingsType,
} from '../config/settings';
import { CollectionsType } from '@/types/collections';

export type AppMessageType = string;

export type AppMessageLogType = AppMessageType[];

export interface StoreType {
	settings: SettingsType;
	appMessageLog: AppMessageLogType; // Public-facing console.log()
	keybinds: CustomAcceleratorsType; // Custom keybinds/accelerators/global shortcuts
	collections: CollectionsType;
}

const schema: Store.Schema<StoreType> = {
	appMessageLog: {
		type: 'array',
		default: [],
	},
	keybinds: {
		type: 'object',
		properties: {
			quit: {
				type: 'string',
			},
			reset: {
				type: 'string',
			},
		},
		default: DEFAULT_KEYBINDS,
	},
	settings: {
		type: 'object',
		properties: {
			allowAnalytics: {
				type: 'boolean',
			},
			allowAutoUpdate: {
				type: 'boolean',
			},
			allowSounds: {
				type: 'boolean',
			},
			allowNotifications: {
				type: 'boolean',
			},
			notificationType: {
				type: 'string',
				enum: ['system', 'app', 'all'],
			},
			showDockIcon: {
				type: 'boolean',
			},
			showTrayIcon: {
				type: 'boolean',
			},
			quitOnWindowClose: {
				type: 'boolean',
			},
			theme: {
				type: 'string',
				enum: ['system', 'light', 'dark'],
			},
			apiClientLayout: {
				type: 'string',
				enum: ['horizontal', 'vertical'],
			},
		},
		default: DEFAULT_SETTINGS,
	},
	collections: {
		type: 'object',
		properties: {
			openIds: {
				type: 'array',
				items: {
					type: 'string',
				},
				default: [],
			},
		},
		default: {
			openIds: [],
		},
	},
};

const store = new Store<StoreType>({ schema });

export default store;
