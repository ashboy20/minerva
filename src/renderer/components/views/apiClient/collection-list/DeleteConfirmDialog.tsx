import React from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogClose,
	DialogPortal,
	DialogOverlay,
} from '@/renderer/components/ui/dialog';
import { Button } from '@/renderer/components/ui/button';

interface DeleteConfirmDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	itemName: string;
	onConfirm: () => void;
}

export function DeleteConfirmDialog({
	isOpen,
	onOpenChange,
	itemName,
	onConfirm,
}: DeleteConfirmDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogPortal>
				<DialogOverlay className="fixed inset-0 z-50 bg-black/50" />
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Confirmation</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p>
							Are you sure you want to delete &quot;
							{itemName}
							&quot;?
						</p>
						<p className="mt-2 text-sm text-muted-foreground">
							This action cannot be undone.
						</p>
					</div>
					<div className="flex justify-end gap-3">
						<DialogClose asChild>
							<Button variant="outline">Cancel</Button>
						</DialogClose>
						<Button
							variant="destructive"
							onClick={() => {
								onConfirm();
								onOpenChange(false);
							}}
						>
							Delete
						</Button>
					</div>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
}
