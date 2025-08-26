export type Row = {
    row_id: number;
    keyValue: string;
    value: string;
    enabled: boolean;
}

export type Request = {
    headers: Row[];
    query_params: Row[];
    path_params: Row[];
    body: Record<string, any> | null;
}

export type Response = {
    status_code: number;
    headers: Row[];
    body: Record<string, any> | null;
}

export type Case = {
    id: number;
    name: string;
    description: string;
    request: Request;
    response: Response;
}

export type Endpoint = {
    id: number;
    operation_id: string;
    name: string;
    summary: string;
    description: string;
    method: string;
    path: string;
    base_url: string;
    cases: Case[];
}