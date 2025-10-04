import React from 'react';
import {
	CardHeader,
	CardTitle,
} from '@/renderer/components/ui/card';
import { Button } from '@/renderer/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/renderer/components/ui/tooltip';
import { Plus } from 'lucide-react';

interface CollectionHeaderProps {
	onCreateCollection: () => void;
}

export function CollectionHeader({
	onCreateCollection,
}: CollectionHeaderProps) {
	return (
		<CardHeader className="pb-3">
			<div className="flex items-center justify-between">
				<CardTitle className="text-lg">
					Collections
				</CardTitle>
				<TooltipProvider>
					<div className="flex items-center gap-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={onCreateCollection}
								>
									<Plus className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Create new collection</p>
							</TooltipContent>
						</Tooltip>
					</div>
				</TooltipProvider>
			</div>
		</CardHeader>
	);
}
