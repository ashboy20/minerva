import {
	Select,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectItem,
} from '@/renderer/components/ui/select';
import { HTTP_METHODS } from '@/data/apiClient';
import { MethodText } from '@/renderer/components/common-ui/MethodText';
import { Button } from '@/renderer/components/ui/button';
import { PlayIcon } from '@radix-ui/react-icons';
import React from 'react';
import { UrlInputField } from '@/renderer/components/views/apiClient/request-section/UrlInputField';

interface UrlBarProps {
	method: string;
	url: string;
	loading: boolean;
	onMethodChange: (method: string) => void;
	onUrlChange: (url: string) => void;
	onSendRequest: () => void;
}

function UrlBar({
	method,
	url,
	loading,
	onMethodChange,
	onUrlChange,
	onSendRequest,
}: UrlBarProps) {
	return (
		<div className="flex space-x-2">
			<Select
				value={method ?? 'GET'}
				onValueChange={onMethodChange}
			>
				<SelectTrigger className="w-32">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{HTTP_METHODS.map((m) => (
						<SelectItem key={m} value={m}>
							<MethodText method={m} />
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<UrlInputField value={url} onChange={onUrlChange} />

			<Button
				onClick={onSendRequest}
				disabled={loading || !url || !String(url).trim()}
				className="px-6"
			>
				{loading ? (
					<>Sending...</>
				) : (
					<>
						<PlayIcon className="mr-2 h-4 w-4" />
						Send
					</>
				)}
			</Button>
		</div>
	);
}

export default UrlBar;
