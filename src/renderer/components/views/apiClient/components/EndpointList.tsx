import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/renderer/components/ui/card';
import { Badge } from '@/renderer/components/ui/badge';
import { MethodText } from '@/renderer/components/common-ui/MethodText';
import { Button } from '@/components/ui/button';
import { ipcChannels } from '@/config/ipc-channels';

interface Row {
	id: number;
	keyValue: string;
	value: string;
	enabled: boolean;
}

interface EndpointListProps {
	endpoints: any[];
	onEndpointClick: (endpoint: any) => void;
}

export function EndpointList({ endpoints, onEndpointClick }: EndpointListProps) {
	const [isResetting, setIsResetting] = useState(false);

	const handleReset = async () => {
		const confirmed = window.confirm(
			'Are you sure you want to reset the database? This will remove all endpoints and recreate them with default data. This action cannot be undone.'
		);
		
		if (!confirmed) {
			return;
		}

		setIsResetting(true);
		try {
			console.log('🔄 Resetting database...');
			const result = await window.electron.ipcRenderer.invoke(
				ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_RESET
			);

			if (result.status === 200) {
				console.log('✅ Database reset successfully');
				alert('Database reset successfully! The page will reload to show the updated data.');
				window.location.reload(); // Simple way to refresh the entire app
			} else {
				console.error('❌ Database reset failed:', result.error);
				alert(`Database reset failed: ${result.error || result.message}`);
			}
		} catch (error) {
			console.error('❌ Error resetting database:', error);
			alert(`Error resetting database: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setIsResetting(false);
		}
	};

	return (
		<div className="h-full p-4 border-r">
			<Card className="h-full border-none">
				<CardHeader className="pb-3">
					<CardTitle className="text-lg">Endpoints</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<div className="space-y-1">
						{endpoints.map((endpoint) => (
							<div
								key={endpoint.id}
								className="px-3 py-2 hover:bg-muted cursor-pointer rounded-sm mx-3"
								onClick={() => onEndpointClick(endpoint)}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onEndpointClick(endpoint);
									}
								}}
							>
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">
										{endpoint.name}
									</span>
									<Badge variant="secondary" className="text-xs">
										<MethodText method={endpoint.method} />
									</Badge>
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									{endpoint.url}
								</p>
							</div>
						))}
					</div>
					<Button onClick={handleReset} disabled={isResetting}>
						{isResetting ? 'Resetting...' : 'Reset Database'}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
