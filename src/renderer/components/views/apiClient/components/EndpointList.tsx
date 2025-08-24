import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/renderer/components/ui/card';
import { Badge } from '@/renderer/components/ui/badge';

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
										{endpoint.method}
									</Badge>
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									{endpoint.url}
								</p>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
