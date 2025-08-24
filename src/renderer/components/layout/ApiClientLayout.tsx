import { Separator } from '@/renderer/components/ui/separator';
import { ScrollArea } from '@/renderer/components/ui/ScrollPane';
import { SidebarNav } from '@/renderer/components/ui/SidebarNav';

import { CodeIcon } from '@radix-ui/react-icons';
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

interface ApiClientLayoutProps {
	children?: React.ReactNode;
}

// Navigation items for API client - you can customize these as needed
const apiClientNavItems = [
	{
		title: 'Request Builder',
		href: '/api-client',
		icon: CodeIcon,
	},
];

export default function ApiClientLayout({ children }: ApiClientLayoutProps) {
	const { pathname: location } = useLocation();

	return (
		<div className="h-full flex flex-col">
			<div className="flex flex-1 min-h-0">
				{/* TODO: make it as a side nav bar which is expandable and hide */}
				<ScrollArea className="bg-secondary min-w-12 md:w-1/5 shadow-inner max-w-12">
					<SidebarNav items={apiClientNavItems} className="py-2" />
				</ScrollArea>
				<Separator orientation="vertical" />
				<div className="flex-1 min-h-0" key={location}>
					<div className="h-full px-4 py-4">{children || <Outlet />}</div>
				</div>
			</div>
		</div>
	);
}
