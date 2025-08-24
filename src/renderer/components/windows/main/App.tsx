// todo: menubar ellipsis on overflow
import { MainLayout } from '@/renderer/components/layout/MainLayout';
import { Home } from '@/renderer/components/views/Home';
import {
    Route,
    RouterProvider,
    createHashRouter,
    createRoutesFromElements,
} from 'react-router-dom';

import SettingsLayout from '@/renderer/components/layout/SettingsLayout';
import ApiClientLayout from '@/renderer/components/layout/ApiClientLayout';
import ErrorPage from '@/renderer/components/views/ErrorPage';
import { settingsNavItems, apiClientNavItems } from '@/renderer/config/nav';
import '@/renderer/styles/globals.scss';

export default function App() {
	const settingsIndex =
		settingsNavItems.find((item) => item.index) || settingsNavItems[0];
	const apiClientIndex =
		apiClientNavItems.find((item) => item.index) || apiClientNavItems[0];

	const routes = (
		<Route path="/" element={<MainLayout />} errorElement={<ErrorPage />}>
			<Route path="settings" element={<SettingsLayout />}>
				{settingsNavItems.map((item) => {
					/* Dynamically add routes for settings */
					return (
						<Route
							key={item.title}
							path={item.href}
							element={<>{item.element}</>}
						/>
					);
				})}

				{settingsIndex && (
					<>
						<Route index path="*" element={<>{settingsIndex.element}</>} />
					</>
				)}
			</Route>

			<Route path="apiClient" element={<ApiClientLayout />}>
				{apiClientNavItems.map((item) => {
					/* Dynamically add routes for API client */
					return (
						<Route
							key={item.title}
							path={item.href}
							element={<>{item.element}</>}
						/>
					);
				})}

				{apiClientIndex && (
					<>
						<Route index path="*" element={<>{apiClientIndex.element}</>} />
					</>
				)}
			</Route>

			<Route index element={<Home />} />
			<Route path="*" element={<Home />} />
		</Route>
	);

	const router = createHashRouter(createRoutesFromElements(routes));

	return (
		<>
			<RouterProvider router={router} />
		</>
	);
}
