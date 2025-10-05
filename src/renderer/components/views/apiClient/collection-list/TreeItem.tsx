import React, { useEffect, useState } from 'react';
import {
	Collapsible,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DeleteConfirmDialog } from '@/renderer/components/views/apiClient/collection-list/DeleteConfirmDialog';
import {
	ChevronDown,
	ChevronRight,
	FileText,
	Folder,
	Plus,
	FolderPlus,
	Edit,
	Copy,
	Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MethodText } from '@/renderer/components/common-ui/MethodText';
import { useAppDispatch } from '@/store/hooks';
import {
	getCollections,
	updateItem,
	deleteItem,
} from '@/store/slices/collectionSlice';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/renderer/components/ui/context-menu';
import { Input } from '@/renderer/components/ui/input';
import { MinervaNodeModel } from '@/renderer/components/views/apiClient/collection-list/CollectionList';

interface TreeItemProps {
	node: MinervaNodeModel;
	depth: number;
	isOpen: boolean;
	onToggle: () => void;
	isDragging?: boolean;
	isDropTarget?: boolean;
	onCreateItem: (
		name: string,
		type: 'folder' | 'endpoint',
		parentId: string,
	) => Promise<boolean>;
}

const getIcon = (
	type: string | 'folder' | 'endpoint' | 'collection',
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

interface NewItemInputProps {
	type: 'folder' | 'endpoint';
	parentId: string;
	depth: number;
	onCancel: () => void;
	onCreateItem: (
		name: string,
		type: 'folder' | 'endpoint',
		parentId: string,
	) => Promise<boolean>;
}

const NewItemInput: React.FC<NewItemInputProps> = ({
	type,
	parentId,
	depth,
	onCancel,
	onCreateItem,
}) => {
	const [name, setName] = useState('');
	const inputRef = React.useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (inputRef.current) {
			const timeoutId = setTimeout(() => {
				if (inputRef.current) {
					inputRef.current.focus();
				}
			}, 200);
			return () => clearTimeout(timeoutId);
		}
	}, []);

	const handleCreate = async (inputName: string) => {
		if (inputName.trim() === '') return;
		const success = await onCreateItem(
			inputName,
			type,
			parentId,
		);
		if (success) {
			onCancel();
		}
	};

	return (
		<div
			className="mx-3 flex items-center gap-2 rounded-sm px-3 py-2 text-sm"
			style={{
				paddingLeft: depth * 16 + 12,
			}}
		>
			<span className="w-4 shrink-0" />
			<div className="h-4 w-4 shrink-0">
				{getIcon(type)}
			</div>
			<div className="flex flex-1 items-center">
				<Input
					className="h-7 px-1 py-0 text-sm"
					ref={inputRef}
					value={name}
					onChange={(e) => setName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							handleCreate(e.currentTarget.value);
						} else if (e.key === 'Escape') {
							onCancel();
						}
					}}
					onBlur={(e) => {
						if (e.target.value.trim() !== '') {
							handleCreate(e.target.value);
						} else {
							onCancel();
						}
					}}
					placeholder={`Enter ${type} name`}
					autoFocus
				/>
			</div>
		</div>
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
			onCreateItem,
		},
		ref,
	) => {
		const dispatch = useAppDispatch();
		const [isEditing, setIsEditing] = useState(false);
		const [creatingItemType, setCreatingItemType] =
			useState<'folder' | 'endpoint' | null>(null);
		const [newName, setNewName] = useState(node.text);
		const [deleteDialogOpen, setDeleteDialogOpen] =
			useState(false);
		const inputRef = React.useRef<HTMLInputElement>(null);

		useEffect(() => {
			setNewName(node.text);
		}, [node.text]);

		useEffect(() => {
			if (isEditing && inputRef.current) {
				const timeoutId = setTimeout(() => {
					if (inputRef.current) {
						inputRef.current.focus();
						inputRef.current.select();
					}
				}, 200);
				return () => clearTimeout(timeoutId);
			}
		}, [isEditing]);

		const handleRename = () => {
			setIsEditing(true);
		};

		const handleSaveRename = async (newName: string) => {
			if (newName.trim() === '') return;
			try {
				await dispatch(
					updateItem({
						uuid: node.id as string,
						fields: {
							name: newName,
						},
					}),
				).unwrap();
				setIsEditing(false);
				dispatch(getCollections());
			} catch {
				// Handle error silently
				setIsEditing(false);
			}
		};

		// Context menu handlers
		const handleAddEndpoint = () => {
			setCreatingItemType('endpoint');
		};

		const handleAddFolder = () => {
			setCreatingItemType('folder');
		};

		const handleDuplicate = () => {
			console.log(
				`Duplicate ${node.data.type}:`,
				node.text,
			);
		};

		const handleDelete = () => {
			setDeleteDialogOpen(true);
		};

		const handleConfirmDelete = async () => {
			try {
				await dispatch(
					deleteItem(node.id as string),
				).unwrap();
			} catch (error) {
				console.error('Error deleting item:', error);
			}
		};

		const handleEdit = () => {
			console.log(`Edit endpoint:`, node.text);
		};

		const isCollection = () =>
			node.data.type === 'collection';
		const isFolder = () => node.data.type === 'folder';
		const isEndpoint = () => node.data.type === 'endpoint';

		const itemContent = (
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
						{isEditing ? (
							<Input
								className="h-7 px-1 py-0 text-sm"
								ref={inputRef}
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleSaveRename(e.currentTarget.value);
									} else if (e.key === 'Escape') {
										setNewName(node.text);
										setIsEditing(false);
									}
								}}
								onBlur={(e) =>
									handleSaveRename(e.target.value)
								}
								placeholder={`Enter ${node.data.type} name`}
								autoFocus
							/>
						) : (
							<span className="truncate text-sm font-medium">
								{node.text}
							</span>
						)}
					</div>
					{node.data.type === 'endpoint' &&
						node.data.method &&
						methodBadge(node.data.method)}
				</div>
			</div>
		);

		return (
			<div ref={ref}>
				<Collapsible>
					<CollapsibleTrigger asChild>
						<ContextMenu modal={!deleteDialogOpen}>
							<ContextMenuTrigger>
								{itemContent}
							</ContextMenuTrigger>
							<ContextMenuContent>
								{/* Add items for collections and folders */}
								{(isCollection() || isFolder()) && (
									<>
										<ContextMenuItem
											onClick={handleAddEndpoint}
										>
											<Plus className="mr-2 h-4 w-4" />
											Add Endpoint
										</ContextMenuItem>
										<ContextMenuItem
											onClick={handleAddFolder}
										>
											<FolderPlus className="mr-2 h-4 w-4" />
											Add Folder
										</ContextMenuItem>
										<ContextMenuSeparator />
									</>
								)}

								{/* Edit for endpoints */}
								{isEndpoint() && (
									<>
										<ContextMenuItem
											onClick={handleEdit}
											disabled
										>
											<Edit className="mr-2 h-4 w-4" />
											Edit
										</ContextMenuItem>
									</>
								)}

								{/* Rename for all items */}
								<ContextMenuItem onClick={handleRename}>
									<Edit className="mr-2 h-4 w-4" />
									Rename
								</ContextMenuItem>

								{/* Duplicate for all items */}
								<ContextMenuItem
									onClick={handleDuplicate}
									disabled
								>
									<Copy className="mr-2 h-4 w-4" />
									Duplicate
								</ContextMenuItem>

								<ContextMenuSeparator />

								{/* Delete for all items */}
								<ContextMenuItem
									className="text-red-600 focus:text-red-600"
									onClick={handleDelete}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</ContextMenuItem>
							</ContextMenuContent>
						</ContextMenu>
					</CollapsibleTrigger>
					{/* Show new item input when creating */}
					{creatingItemType && (
						<NewItemInput
							type={creatingItemType}
							parentId={node.id as string}
							depth={depth + 1}
							onCancel={() => setCreatingItemType(null)}
							onCreateItem={onCreateItem}
						/>
					)}
				</Collapsible>
				<DeleteConfirmDialog
					isOpen={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					itemName={node.text}
					onConfirm={handleConfirmDelete}
				/>
			</div>
		);
	},
);

TreeItem.displayName = 'TreeItem';
