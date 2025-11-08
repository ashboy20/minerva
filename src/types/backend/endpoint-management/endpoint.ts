export type Row = {
	row_id: number;
	keyValue: string;
	value: string;
	enabled: boolean;
	disabled?: boolean;
};

export type Request = {
	base_url?: string;
	full_url?: string;
	path?: string;
	headers: Row[];
	query_params: Row[];
	path_params: Row[];
	body: Record<string, any> | null;
	auth: {
		auth_type: string;
		token: string;
	} | null;
};

export type Response = {
	status_code: number;
	headers: Row[];
	body: Record<string, any> | null;
};

export type Case = {
	id: number;
	uuid: string;
	name: string;
	description: string;y
	request: Request;
	response: Response;
};

export type Endpoint = {
	id: number;
	uuid: string;
	name: string;
	summary: string;
	description: string;
	method: string;
	url: string;
	cases: Case[];
};
