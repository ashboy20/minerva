import React from 'react';

interface MethodTextProps {
	method: string;
}

const getMethodTextColor = (methodName: string) => {
	switch (methodName.toUpperCase()) {
		case 'GET':
			return 'text-green-600';
		case 'POST':
			return 'text-blue-600';
		case 'PUT':
			return 'text-orange-600';
		case 'PATCH':
			return 'text-yellow-600';
		case 'DELETE':
			return 'text-red-600';
		case 'HEAD':
			return 'text-purple-600';
		case 'OPTIONS':
			return 'text-gray-600';
		default:
			return 'text-gray-500';
	}
};

export function MethodText({ method }: MethodTextProps) {
	return (
		<span className={`font-medium ${getMethodTextColor(method)}`}>
			{method}
		</span>
	);
}
