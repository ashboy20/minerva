import AppStatus from '@/renderer/components/footer/AppStatus';
import { Footer } from '@/renderer/components/footer/Footer';
import OnlineStatus from '@/renderer/components/footer/OnlineStatus';
import { Menu } from '@/renderer/components/menu/Menu';
import { useGlobalContext } from '@/renderer/context/global-context';

import React from 'react';
import { Outlet } from 'react-router-dom';

// We can't use the ScrollArea here or the scroll will persist between navigations
export function MainLayout({
	children,
}: {
	children?: React.ReactNode;
}) {
	const { settings } = useGlobalContext();

	return (
		<div className="flex h-full w-full flex-col">
			<style>{`
				* {
					border-color: ${settings.accentColor};
				}
			`}</style>
			<Menu className="shrink-0" />
			<div className="flex min-h-0 grow border-t">
				<div className="min-w-0 grow overflow-y-auto">
					{children || <Outlet />}
				</div>
			</div>
			<Footer>
				<OnlineStatus />
				<AppStatus />
			</Footer>
		</div>
	);
}
