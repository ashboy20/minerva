import React from 'react';
import { Button } from '@/renderer/components/ui/button';
import { useGlobalContext } from '@/renderer/context/global-context';
import { ApiClientLayoutType } from '@/config/settings';
import { Rows3, Columns3 } from 'lucide-react';

interface LayoutSwitcherProps {
	className?: string;
}

export function LayoutSwitcher({ className }: LayoutSwitcherProps) {
	const { settings, setSettings } = useGlobalContext();

	const handleLayoutChange = (layout: ApiClientLayoutType) => {
		setSettings({ apiClientLayout: layout });
	};

	return (
		<div className={`flex items-center gap-1 ${className || ''}`}>
			<Button
				variant={settings.apiClientLayout === 'vertical' ? 'default' : 'outline'}
				size="sm"
				onClick={() => handleLayoutChange('vertical')}
				className="h-6 w-6 p-0"
				title="Vertical Layout (Request on top, Response on bottom)"
			>
				<Rows3 className="h-3 w-3" />
			</Button>
			<Button
				variant={settings.apiClientLayout === 'horizontal' ? 'default' : 'outline'}
				size="sm"
				onClick={() => handleLayoutChange('horizontal')}
				className="h-6 w-6 p-0"
				title="Horizontal Layout (Request on left, Response on right)"
			>
				<Columns3 className="h-3 w-3" />
			</Button>
		</div>
	);
}
