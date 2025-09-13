import React, { useState } from 'react';
import { Input } from '@/renderer/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/renderer/components/ui/select';

interface AuthSectionProps {
	authType?: string;
	token?: string;
	onAuthChange: (authType: string, token: string) => void;
}

export function AuthSection({
	authType = 'Bearer',
	token = '',
	onAuthChange,
}: AuthSectionProps) {
    const [authTypeState, setAuthTypeState] = useState(authType);
    const [tokenState, setTokenState] = useState(token);

    const handleAuthTypeChange = (authType: string) => {
        setAuthTypeState(authType);
        onAuthChange(authType, token);
    };

    const handleTokenChange = (token: string) => {
        setTokenState(token);
        onAuthChange(authType, token);
    };

	return (
		<div className="space-y-2">
			<Select value={authTypeState} onValueChange={handleAuthTypeChange}>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select auth type" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="Bearer">Bearer Token</SelectItem>
					<SelectItem value="Basic">Basic Auth</SelectItem>
					<SelectItem value="API Key">API Key</SelectItem>
					<SelectItem value="OAuth 2.0">OAuth 2.0</SelectItem>
					<SelectItem value="None">No Auth</SelectItem>
				</SelectContent>
			</Select>
			
			{authType !== 'None' && (
				<Input 
					placeholder={
						authType === 'Bearer' ? 'Enter bearer token' :
						authType === 'Basic' ? 'Enter credentials (username:password)' :
						authType === 'API Key' ? 'Enter API key' :
						authType === 'OAuth 2.0' ? 'Enter OAuth token' :
						'Enter auth value'
					}
					type="password" 
					value={tokenState}
					onChange={(e) => handleTokenChange(e.target.value)}
				/>
			)}
		</div>
	);
}
