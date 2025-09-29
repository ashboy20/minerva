import React, { useState } from 'react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/renderer/components/ui/card';
import { Badge } from '@/renderer/components/ui/badge';
import { MethodText } from '@/renderer/components/common-ui/MethodText';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
	ChevronRight,
	ChevronDown,
	Folder,
	FileText,
	Copy,
	Edit,
	Trash2,
	FolderPlus,
	Plus,
} from 'lucide-react';
import {
	Collection,
	Item,
	Folder as CollectionFolder,
	Endpoint as CollectionEndpoint,
} from '@/store/slices/collectionSlice';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/renderer/components/ui/context-menu';

// Context menu action handlers
const handleAddEndpoint = (
	containerName: string,
	containerType: 'folder' | 'collection',
) => {
	console.log(
		`Add Endpoint to ${containerType}:`,
		containerName,
	);
};

const handleAddFolder = (
	containerName: string,
	containerType: 'folder' | 'collection',
) => {
	console.log(
		`Add Folder to ${containerType}:`,
		containerName,
	);
};

const handleRename = (
	itemName: string,
	itemType: 'folder' | 'endpoint' | 'collection',
) => {
	console.log(`Rename ${itemType}:`, itemName);
};

const handleDuplicate = (
	itemName: string,
	itemType: 'folder' | 'endpoint' | 'collection',
) => {
	console.log(`Duplicate ${itemType}:`, itemName);
};

const handleDelete = (
	itemName: string,
	itemType: 'folder' | 'endpoint' | 'collection',
) => {
	console.log(`Delete ${itemType}:`, itemName);
};

const handleEdit = (itemName: string) => {
	console.log('Edit endpoint:', itemName);
};

// Context menu components
const FolderContextMenu = ({
	folder,
}: {
	folder: CollectionFolder;
}) => (
	<ContextMenuContent>
		<ContextMenuItem
			onClick={() =>
				handleAddEndpoint(folder.name, 'folder')
			}
		>
			<Plus className="mr-2 h-4 w-4" />
			Add Endpoint
		</ContextMenuItem>
		<ContextMenuItem
			onClick={() => handleAddFolder(folder.name, 'folder')}
		>
			<FolderPlus className="mr-2 h-4 w-4" />
			Add Folder
		</ContextMenuItem>
		<ContextMenuSeparator />
		<ContextMenuItem
			onClick={() => handleRename(folder.name, 'folder')}
		>
			<Edit className="mr-2 h-4 w-4" />
			Rename
		</ContextMenuItem>
		<ContextMenuItem
			onClick={() => handleDuplicate(folder.name, 'folder')}
		>
			<Copy className="mr-2 h-4 w-4" />
			Duplicate
		</ContextMenuItem>
		<ContextMenuSeparator />
		<ContextMenuItem
			className="text-red-600 focus:text-red-600"
			onClick={() => handleDelete(folder.name, 'folder')}
		>
			<Trash2 className="mr-2 h-4 w-4" />
			Delete
		</ContextMenuItem>
	</ContextMenuContent>
);

const EndpointContextMenu = ({
	endpoint,
}: {
	endpoint: CollectionEndpoint;
}) => (
	<ContextMenuContent>
		<ContextMenuItem
			onClick={() => handleEdit(endpoint.name)}
		>
			<Edit className="mr-2 h-4 w-4" />
			Edit
		</ContextMenuItem>
		<ContextMenuItem
			onClick={() =>
				handleDuplicate(endpoint.name, 'endpoint')
			}
		>
			<Copy className="mr-2 h-4 w-4" />
			Duplicate
		</ContextMenuItem>
		<ContextMenuSeparator />
		<ContextMenuItem
			className="text-red-600 focus:text-red-600"
			onClick={() =>
				handleDelete(endpoint.name, 'endpoint')
			}
		>
			<Trash2 className="mr-2 h-4 w-4" />
			Delete
		</ContextMenuItem>
	</ContextMenuContent>
);

const CollectionContextMenu = ({
	collection,
}: {
	collection: Collection;
}) => (
	<ContextMenuContent>
		<ContextMenuItem
			onClick={() =>
				handleAddEndpoint(
					collection.info.name,
					'collection',
				)
			}
		>
			<Plus className="mr-2 h-4 w-4" />
			Add Endpoint
		</ContextMenuItem>
		<ContextMenuItem
			onClick={() =>
				handleAddFolder(collection.info.name, 'collection')
			}
		>
			<FolderPlus className="mr-2 h-4 w-4" />
			Add Folder
		</ContextMenuItem>
		<ContextMenuSeparator />
		<ContextMenuItem
			onClick={() =>
				handleRename(collection.info.name, 'collection')
			}
		>
			<Edit className="mr-2 h-4 w-4" />
			Rename
		</ContextMenuItem>
		<ContextMenuItem
			onClick={() =>
				handleDuplicate(collection.info.name, 'collection')
			}
		>
			<Copy className="mr-2 h-4 w-4" />
			Duplicate
		</ContextMenuItem>
		<ContextMenuSeparator />
		<ContextMenuItem
			className="text-red-600 focus:text-red-600"
			onClick={() =>
				handleDelete(collection.info.name, 'collection')
			}
		>
			<Trash2 className="mr-2 h-4 w-4" />
			Delete
		</ContextMenuItem>
	</ContextMenuContent>
);

interface EndpointListProps {
	collections: Collection[];
	loading: boolean;
	error: string | null;
	onEndpointClick?: (endpoint: CollectionEndpoint) => void;
}

// Tree item component for folders
function FolderItem({
	folder,
	level = 0,
	onEndpointClick,
}: {
	folder: CollectionFolder;
	level?: number;
	onEndpointClick?: (endpoint: CollectionEndpoint) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const paddingLeft = level * 16;

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<CollapsibleTrigger asChild>
						<div
							className="mx-3 flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-muted"
							style={{
								paddingLeft: `${paddingLeft + 12}px`,
							}}
						>
							{isOpen ? (
								<ChevronDown className="h-4 w-4 text-muted-foreground" />
							) : (
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							)}
							<Folder className="h-4 w-4 text-amber-600" />
							<span className="font-medium">
								{folder.name}
							</span>
						</div>
					</CollapsibleTrigger>
				</ContextMenuTrigger>
				<FolderContextMenu folder={folder} />
			</ContextMenu>
			<CollapsibleContent>
				<div className="space-y-1">
					{folder.items.map((item) => (
						<TreeItem
							key={item.name}
							item={item}
							level={level + 1}
							onEndpointClick={onEndpointClick}
						/>
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

// Tree item component for endpoints
function EndpointItem({
	endpoint,
	level = 0,
	onEndpointClick,
}: {
	endpoint: CollectionEndpoint;
	level?: number;
	onEndpointClick?: (endpoint: CollectionEndpoint) => void;
}) {
	const paddingLeft = level * 16;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					className="mx-3 flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 hover:bg-muted"
					style={{ paddingLeft: `${paddingLeft + 12}px` }}
					onClick={() => onEndpointClick?.(endpoint)}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							onEndpointClick?.(endpoint);
						}
					}}
				>
					<FileText className="h-4 w-4 text-blue-600" />
					<div className="flex flex-1 items-center justify-between">
						<span className="text-sm font-medium">
							{endpoint.name}
						</span>
						<Badge
							variant="secondary"
							className="ml-2 text-xs"
						>
							<MethodText method={endpoint.method} />
						</Badge>
					</div>
				</div>
			</ContextMenuTrigger>
			<EndpointContextMenu endpoint={endpoint} />
		</ContextMenu>
	);
}

// Generic tree item component
function TreeItem({
	item,
	level = 0,
	onEndpointClick,
}: {
	item: Item;
	level?: number;
	onEndpointClick?: (endpoint: CollectionEndpoint) => void;
}) {
	if (item.type === 'folder') {
		return (
			<FolderItem
				folder={item as CollectionFolder}
				level={level}
				onEndpointClick={onEndpointClick}
			/>
		);
	} else if (item.type === 'endpoint') {
		return (
			<EndpointItem
				endpoint={item as CollectionEndpoint}
				level={level}
				onEndpointClick={onEndpointClick}
			/>
		);
	}
	return null;
}

// Collection component
function CollectionItem({
	collection,
	onEndpointClick,
}: {
	collection: Collection;
	onEndpointClick?: (endpoint: CollectionEndpoint) => void;
}) {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<CollapsibleTrigger asChild>
						<div className="mx-3 flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold hover:bg-muted">
							{isOpen ? (
								<ChevronDown className="h-4 w-4 text-muted-foreground" />
							) : (
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							)}
							<Folder className="h-4 w-4 text-purple-600" />
							<span>{collection.info.name}</span>
						</div>
					</CollapsibleTrigger>
				</ContextMenuTrigger>
				<CollectionContextMenu collection={collection} />
			</ContextMenu>
			<CollapsibleContent>
				<div className="space-y-1">
					{collection.items.map((item) => (
						<TreeItem
							key={item.name}
							item={item}
							level={1}
							onEndpointClick={onEndpointClick}
						/>
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

export function EndpointList({
	collections,
	loading,
	error,
	onEndpointClick,
}: EndpointListProps) {
	if (loading) {
		return (
			<div className="h-full border-r p-4">
				<Card className="h-full border-none">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg">
							Collections
						</CardTitle>
					</CardHeader>
					<CardContent className="flex h-32 items-center justify-center p-0">
						<div className="text-sm text-muted-foreground">
							Loading collections...
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="h-full border-r p-4">
				<Card className="h-full border-none">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg">
							Collections
						</CardTitle>
					</CardHeader>
					<CardContent className="flex h-32 items-center justify-center p-0">
						<div className="text-sm text-red-500">
							Error: {error}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="h-full border-r p-4">
			<Card className="h-full border-none">
				<CardHeader className="pb-3">
					<CardTitle className="text-lg">
						Collections
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<div className="space-y-1">
						{collections.length === 0 ? (
							<div className="py-8 text-center text-sm text-muted-foreground">
								No collections found
							</div>
						) : (
							collections.map((collection) => (
								<CollectionItem
									key={collection.uuid}
									collection={collection}
									onEndpointClick={onEndpointClick}
								/>
							))
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
