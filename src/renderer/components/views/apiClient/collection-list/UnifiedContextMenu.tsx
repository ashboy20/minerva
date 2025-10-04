import React from 'react';
import {
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
} from '@/renderer/components/ui/context-menu';
import {
	Collection,
	Folder as CollectionFolder,
	Endpoint as CollectionEndpoint,
} from '@/store/slices/collectionSlice';
import {
	Plus,
	FolderPlus,
	Edit,
	Copy,
	Trash2,
} from 'lucide-react';

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

interface UnifiedContextMenuProps {
	item: 'collection' | 'folder' | 'endpoint';
}

export function UnifiedContextMenu({
	item,
}: UnifiedContextMenuProps) {
	// Type guards
	const isCollection = (item: any): item is 'collection' =>
		item === 'collection';
	const isFolder = (item: any): item is 'folder' =>
		item === 'folder';
	const isEndpoint = (item: any): item is 'endpoint' =>
		item === 'endpoint';

	return (
		<ContextMenuContent>
			{/* Add items for collections and folders */}
			{(isCollection(item) || isFolder(item)) && (
				<>
					<ContextMenuItem onClick={() => {}}>
						<Plus className="mr-2 h-4 w-4" />
						Add Endpoint
					</ContextMenuItem>
					<ContextMenuItem onClick={() => {}}>
						<FolderPlus className="mr-2 h-4 w-4" />
						Add Folder
					</ContextMenuItem>
					<ContextMenuSeparator />
				</>
			)}

			{/* Edit for endpoints */}
			{isEndpoint(item) && (
				<>
					<ContextMenuItem onClick={() => {}}>
						<Edit className="mr-2 h-4 w-4" />
						Edit
					</ContextMenuItem>
				</>
			)}

			{/* Rename for all items */}
			<ContextMenuItem onClick={() => {}}>
				<Edit className="mr-2 h-4 w-4" />
				Rename
			</ContextMenuItem>

			{/* Duplicate for all items */}
			<ContextMenuItem onClick={() => {}}>
				<Copy className="mr-2 h-4 w-4" />
				Duplicate
			</ContextMenuItem>

			<ContextMenuSeparator />

			{/* Delete for all items */}
			<ContextMenuItem
				className="text-red-600 focus:text-red-600"
				onClick={() => {}}
			>
				<Trash2 className="mr-2 h-4 w-4" />
				Delete
			</ContextMenuItem>
		</ContextMenuContent>
	);
}
