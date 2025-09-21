import time
import json
import requests
from requests.auth import HTTPBasicAuth
from typing import Union, Dict, Any

from app.models.call_endpoint import ApiRequest, ApiResponse


class CallEndpointService:
    """Service for calling external API endpoints"""

    async def call_endpoint(self, request: ApiRequest) -> ApiResponse:
        """Call an external API endpoint and return structured response"""

        start_time = time.time()

        try:
            # Prepare request parameters
            request_kwargs = {
                "method": request.method.upper(),
                "url": request.url,
                "timeout": 30,  # 30 second timeout
            }

            # Add headers if provided
            if request.headers:
                request_kwargs["headers"] = request.headers

            # Add query parameters if provided
            if request.query_params:
                request_kwargs["params"] = request.query_params

            # Add authentication if provided
            if (
                request.auth
                and request.auth.auth_type == "Bearer"
                and request.auth.token
            ):
                if "headers" not in request_kwargs:
                    request_kwargs["headers"] = {}
                request_kwargs["headers"][
                    "Authorization"
                ] = f"Bearer {request.auth.token}"
            elif (
                request.auth
                and request.auth.auth_type == "Basic"
                and request.auth.token
            ):
                # For basic auth, token should be "username:password"
                username, password = request.auth.token.split(":", 1)
                request_kwargs["auth"] = HTTPBasicAuth(username, password)

            # Add body for non-GET requests
            if request.body and request.method.upper() not in ["GET", "HEAD"]:
                if isinstance(request.body, str):
                    # Try to parse as JSON first, fallback to raw string
                    try:
                        json.loads(request.body)
                        request_kwargs["data"] = request.body
                        if "headers" not in request_kwargs:
                            request_kwargs["headers"] = {}
                        if "content-type" not in {
                            k.lower(): v for k, v in request_kwargs["headers"].items()
                        }:
                            request_kwargs["headers"][
                                "Content-Type"
                            ] = "application/json"
                    except json.JSONDecodeError:
                        request_kwargs["data"] = request.body
                else:
                    request_kwargs["json"] = request.body

            # Make the actual request
            response = requests.request(**request_kwargs)

            # Calculate response time
            end_time = time.time()
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds

            # Parse response body
            try:
                if response.headers.get("content-type", "").startswith(
                    "application/json"
                ):
                    response_body = response.json()
                else:
                    response_body = response.text
            except (json.JSONDecodeError, ValueError):
                response_body = response.text

            # Convert headers to dict
            response_headers = dict(response.headers)

            # Calculate response size
            response_size = len(response.content)

            return ApiResponse(
                status_code=response.status_code,
                headers=response_headers,
                body=response_body,
                response_time=response_time,
                size=response_size,
            )

        except requests.exceptions.RequestException as e:
            # Handle request errors
            end_time = time.time()
            response_time = (end_time - start_time) * 1000

            return ApiResponse(
                status_code=0,  # Indicate connection error
                headers={},
                body={"error": str(e), "error_type": type(e).__name__},
                response_time=response_time,
                size=0,
            )

        except Exception as e:
            # Handle unexpected errors
            end_time = time.time()
            response_time = (end_time - start_time) * 1000

            return ApiResponse(
                status_code=0,
                headers={},
                body={
                    "error": f"Unexpected error: {str(e)}",
                    "error_type": type(e).__name__,
                },
                response_time=response_time,
                size=0,
            )


# Global service instance
call_endpoint_service = CallEndpointService()
