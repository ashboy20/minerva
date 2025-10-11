import React from 'react';
import {
	Card,
	CardContent,
} from '@/renderer/components/ui/card';
import { JsonEditorComponent } from '@/renderer/components/views/apiClient/components/JsonEditorComponent';
import { useAppSelector } from '@/store/hooks';

export function ResponseSection() {
	const { response, loading } = useAppSelector(
		(state) => state.response,
	);

	const handleCopyResponse = () => {
		console.log('handleCopyResponse');
		console.log(response?.data);
		navigator.clipboard.writeText(JSON.stringify(response?.data, null, 2));
	};

	return (
		<div className="h-full overflow-y-auto p-4">
			<Card className="flex h-full flex-col border-none">
				<CardContent className="space-y-4 p-4">
					{/* Response Status */}
					{response && (
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span
									className={`text-sm font-medium ${
										response.status >= 400
											? 'text-red-500'
											: 'text-green-500'
									}`}
								>
									{response.status}
								</span>
								<span className="text-sm text-muted-foreground">
									{response.statusText}
								</span>
							</div>
							<div className="flex items-center gap-4">
								<span className="text-sm text-muted-foreground">
									{response.time}ms
								</span>
								<span className="text-sm text-muted-foreground">
									{response.size} bytes
								</span>
							</div>
						</div>
					)}

					{/* Response Body */}
					<JsonEditorComponent
						label="Response"
						buttonLabel="Copy"
						onButtonClick={handleCopyResponse}
						placeholder={
							loading
								? 'Loading...'
								: 'Response will appear here'
						}
						value={
							response
								? JSON.stringify(response.data, null, 2)
								: ''
						}
						onChange={() => {}}
						className="flex-1"
						disabled
						darkTheme
					/>
				</CardContent>
			</Card>
		</div>
	);
}
