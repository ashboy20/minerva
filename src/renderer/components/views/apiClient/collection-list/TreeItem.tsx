import React from 'react';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
	ChevronDown,
	ChevronRight,
	FileText,
	Folder,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MethodText } from '@/renderer/components/common-ui/MethodText';

interface TreeItemProps {
	node: {
		id: number | string;
		text: string;
		droppable?: boolean;
		data?: any;
	};
	depth: number;
	isOpen: boolean;
	onToggle: () => void;
	isDragging?: boolean;
	isDropTarget?: boolean;
}

const getIcon = (
	type: 'folder' | 'endpoint' | 'collection',
) => {
	if (type === 'collection') {
		return <Folder className="h-4 w-4 text-blue-500" />;
	}
	if (type === 'folder') {
		return <Folder className="h-4 w-4 text-yellow-500" />;
	}
	return <FileText className="h-4 w-4 text-green-500" />;
};

const methodBadge = (method: string) => {
	return (
		<Badge variant="secondary" className="ml-2 text-xs">
			<MethodText method={method} />
		</Badge>
	);
};

export const TreeItem = React.forwardRef<
	HTMLDivElement,
	TreeItemProps
>(
	(
		{
			node,
			depth,
			isOpen,
			onToggle,
			isDragging,
			isDropTarget,
		},
		ref,
	) => {
		return (
			<div ref={ref}>
				<Collapsible>
					<CollapsibleTrigger asChild>
						<div
							role="button"
							tabIndex={0}
							className={`mx-3 flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-muted ${
								isDragging ? 'opacity-50' : ''
							} ${isDropTarget ? 'bg-muted' : ''}`}
							style={{
								paddingLeft: depth * 16 + 12,
							}}
						>
							{node.droppable ? (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										onToggle();
									}}
									className="h-4 w-4 shrink-0"
								>
									{isOpen ? (
										<ChevronDown className="h-4 w-4 text-muted-foreground" />
									) : (
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									)}
								</button>
							) : (
								<span className="w-4 shrink-0" /> // Spacer for alignment
							)}
							<div className="h-4 w-4 shrink-0">
								{getIcon(node.data.type)}
							</div>
							<div className="flex flex-1 items-center justify-between">
								<div className="flex flex-col">
									<span className="truncate text-sm font-medium">
										{node.text}
									</span>
								</div>
								{node.data.type === 'endpoint' &&
									methodBadge(node.data.method)}
							</div>
						</div>
					</CollapsibleTrigger>
				</Collapsible>
			</div>
		);
	},
);

TreeItem.displayName = 'TreeItem';
