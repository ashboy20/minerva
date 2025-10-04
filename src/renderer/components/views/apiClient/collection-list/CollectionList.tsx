import React, { useEffect, useState } from 'react';
import {
	Card,
	CardContent,
} from '@/renderer/components/ui/card';
import {
	Collection,
	Endpoint,
	Folder,
	reorder,
} from '@/store/slices/collectionSlice';
import { CollectionHeader } from '@/renderer/components/views/apiClient/collection-list/CollectionHeader';
import { DndProvider } from 'react-dnd';
import {
	Tree,
	getBackendOptions,
	MultiBackend,
	NodeModel,
	DropOptions,
} from '@minoru/react-dnd-treeview';
import { TreeItem } from './TreeItem';
import {
	ContextMenu,
	ContextMenuTrigger,
} from '@/renderer/components/ui/context-menu';
import { UnifiedContextMenu } from '@/renderer/components/views/apiClient/collection-list/UnifiedContextMenu';
import { useAppDispatch } from '@/store/hooks';
import { DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu';

const parseTreeData = (
	items: Collection[] | (Folder | Endpoint)[],
	parentId: string | number = 0,
) => {
	let treeData: NodeModel<any>[] = [];

	items.forEach((item) => {
		// Handle collections
		if (item.type === 'collection') {
			const collectionNode = {
				id: item.uuid,
				parent: parentId,
				droppable: true,
				text: item.name,
				data: {
					type: 'collection',
				},
			};
			treeData.push(collectionNode);

			// Process collection items
			if (item.items?.length) {
				treeData.push(
					...parseTreeData(
						item.items as (Folder | Endpoint)[],
						item.uuid,
					),
				);
			}
		} else {
			// Handle folders and endpoints
			const typedItem = item as Folder | Endpoint;
			const node = {
				id: typedItem.uuid,
				parent: parentId,
				droppable: typedItem.type === 'folder',
				text:
					typedItem.type === 'endpoint'
						? (typedItem.name ??
							(typedItem as Endpoint).url)
						: typedItem.name,
				data: {
					type: typedItem.type,
					...(typedItem.type === 'endpoint' && {
						method: (typedItem as Endpoint).method,
						url: (typedItem as Endpoint).url,
					}),
				},
			};
			treeData.push(node);

			// Process folder items
			if (typedItem.type === 'folder') {
				const folder = typedItem as Folder;
				if (folder.items?.length) {
					treeData.push(
						...parseTreeData(
							folder.items as (Folder | Endpoint)[],
							folder.uuid,
						),
					);
				}
			}
		}
	});

	return treeData;
};

interface CollectionListProps {
	collections: Collection[];
	loading: boolean;
	error: string | null;
	onCreateCollection: () => void;
	onEndpointClick?: (endpoint: Endpoint) => void;
}

export function CollectionList({
	collections,
	loading,
	error,
	onCreateCollection,
	onEndpointClick,
}: CollectionListProps) {
	const dispatch = useAppDispatch();
	const [treeData, setTreeData] = useState<
		NodeModel<any>[]
	>(() => parseTreeData(collections));

	useEffect(() => {
		setTreeData(parseTreeData(collections));
	}, [collections]);

	const handleCanDrop = (
		tree: NodeModel<any>[],
		{ dragSource, dropTargetId }: DropOptions<any>,
	) => {
		// If no drag source, drop is not allowed
		if (!dragSource) return false;

		// Get the dragged item's data
		const draggedItem = tree.find(
			(item) => item.id === dragSource.id,
		);
		if (!draggedItem) return false;

		// Get the drop target item
		const dropTarget = tree.find(
			(item) => item.id === dropTargetId,
		);

		// If dropping at root level (reordering collections)
		if (dropTargetId === 0) {
			return draggedItem.data?.type === 'collection';
		}

		// If no drop target found but not root, disallow drop
		if (!dropTarget) return false;

		const dragType = draggedItem.data?.type;
		const dropType = dropTarget.data?.type;

		// Rules for different item types:
		switch (dragType) {
			case 'endpoint':
				// Endpoints can be dropped in folders or collections
				return (
					dropType === 'folder' ||
					dropType === 'collection' ||
					// Or reordered within current parent
					dragSource.parent === dropTargetId
				);

			case 'folder':
				// Folders can be dropped in collections or other folders
				return (
					dropType === 'folder' ||
					dropType === 'collection' ||
					// Or reordered within current parent
					dragSource.parent === dropTargetId
				);

			case 'collection':
				// Collections can only be reordered at root level
				return dropTargetId === 0;

			default:
				return false;
		}
	};

	const handleDrop = (newTree: NodeModel<any>[], options: DropOptions<any>) => {
		setTreeData(newTree as any);

		dispatch(reorder({
			draggedUuid: options.dragSource?.id as string,
			oldParentUuid: options.dragSource?.parent as string,
			newParentUuid: options.dropTarget?.id as string,
			relativeIndex: options.relativeIndex as number,
		}))

		const draggedItem = newTree.find(
			(item) => item.id === options.dragSource?.id,
		);
		if (!draggedItem) return;

	};

	// Header at the top
	const header = (
		<CollectionHeader
			onCreateCollection={onCreateCollection}
		/>
	);

	// Content based on state
	let content;
	if (loading) {
		content = (
			<CardContent className="flex h-32 items-center justify-center p-0">
				<div className="text-sm text-muted-foreground">
					Loading collections...
				</div>
			</CardContent>
		);
	} else if (error) {
		content = (
			<CardContent className="flex h-32 items-center justify-center p-0">
				<div className="text-sm text-red-500">
					Error: {error}
				</div>
			</CardContent>
		);
	} else {
		content = (
			<CardContent className="p-0">
				<div className="space-y-1">
					{collections.length === 0 ? (
						<div className="py-8 text-center text-sm text-muted-foreground">
							No collections found
						</div>
					) : (
						<>
							<DndProvider
								backend={MultiBackend}
								options={getBackendOptions()}
							>
								<ContextMenu>
									<ContextMenuTrigger>
										<Tree
											tree={treeData}
											rootId={0}
											onDrop={handleDrop}
											sort={false}
											enableAnimateExpand={true}
											canDrop={handleCanDrop}
											dropTargetOffset={5}
											placeholderRender={(
												node,
												{ depth },
											) => (
												<div
													className="h-[2px] w-full bg-blue-600 bg-muted"
													key={node.id}
												/>
											)}
											dragPreviewRender={(monitorProps) => (
												<div style={{ opacity: 0.5 }}>
													<TreeItem
														node={monitorProps.item}
														depth={0}
														isOpen={false}
														onToggle={() => {}}
													/>
												</div>
											)}
											render={(
												node,
												{
													depth,
													isOpen,
													onToggle,
													isDragging,
													isDropTarget,
												},
											) => (
												<TreeItem
													node={node}
													depth={depth}
													isOpen={isOpen}
													onToggle={onToggle}
													isDragging={isDragging}
													isDropTarget={isDropTarget}
												/>
											)}
										/>
									</ContextMenuTrigger>
									<UnifiedContextMenu item="collection" />
								</ContextMenu>
							</DndProvider>
						</>
					)}
				</div>
			</CardContent>
		);
	}

	return (
		<div className="h-full border-r p-4">
			<Card className="h-full border-none">
				{header}
				{content}
			</Card>
		</div>
	);
}
