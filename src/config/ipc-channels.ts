// Whitelist channels for IPC
export type Channels = string;

// Main -> Renderer
const APP_UPDATED = 'app-updated';
const APP_NOTIFICATION = 'app-notification'; // to display a notification using the OS notification system

const PRELOAD_SOUNDS = 'preload-sounds';
const PLAY_SOUND = 'play-sound';

// Renderer -> Main
const GET_APP_INFO = 'get-app-info';
const GET_APP_PATHS = 'get-app-paths';
const GET_RENDERER_SYNC = 'get-renderer-sync';

const SET_KEYBIND = 'set-keybind';
const SET_SETTINGS = 'set-settings';

const RENDERER_READY = 'renderer-ready';

const TRIGGER_APP_MENU_ITEM_BY_ID =
	'trigger-app-menu-item-by-id';
const OPEN_URL = 'open-url';
const OPEN_CHILD_WINDOW = 'open-child-window';

// Backend API channels
const BACKEND_ENDPOINT_MANAGEMENT_COLLECTIONS_GET =
	'backend:endpoint-management:collections:get';
const BACKEND_ENDPOINT_MANAGEMENT_COLLECTION_CREATE =
	'backend:endpoint-management:collection:create';
const BACKEND_ENDPOINT_MANAGEMENT_REORDER =
	'backend:endpoint-management:collection:reorder';
const BACKEND_ENDPOINT_MANAGEMENT_COLLECTION_RENAME =
	'backend:endpoint-management:collection:rename';
const BACKEND_ENDPOINT_MANAGEMENT_FOLDER_RENAME =
	'backend:endpoint-management:folder:rename';
const BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_RENAME =
	'backend:endpoint-management:endpoint:rename';
const BACKEND_API_CALL_ENDPOINT =
	'backend:api-call:endpoint';

export const ipcChannels = {
	// main -> renderer
	APP_NOTIFICATION,
	APP_UPDATED,
	PRELOAD_SOUNDS,
	PLAY_SOUND,

	// renderer -> main
	RENDERER_READY,
	GET_RENDERER_SYNC,
	GET_APP_INFO,
	GET_APP_PATHS,

	SET_KEYBIND,
	SET_SETTINGS,

	TRIGGER_APP_MENU_ITEM_BY_ID,
	OPEN_URL,
	OPEN_CHILD_WINDOW,

	// Backend API channels
	BACKEND_ENDPOINT_MANAGEMENT_COLLECTIONS_GET,
	BACKEND_ENDPOINT_MANAGEMENT_COLLECTION_CREATE,
	BACKEND_ENDPOINT_MANAGEMENT_REORDER,
	BACKEND_ENDPOINT_MANAGEMENT_COLLECTION_RENAME,
	BACKEND_ENDPOINT_MANAGEMENT_FOLDER_RENAME,
	BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_RENAME,
	BACKEND_API_CALL_ENDPOINT,
} as const;
