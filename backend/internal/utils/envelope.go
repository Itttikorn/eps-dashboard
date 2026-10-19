package utils

import (
	"encoding/json"
	"net/http"
)

// MaxBodyBytes sets the standard request body limit (10MB).
const MaxBodyBytes = 10 * 1024 * 1024

// --- API response envelope ---

type StatusInfo struct {
	Code        int    `json:"code"`
	Header      string `json:"header"`
	Description string `json:"description"`
}

// Response mirrors corporate standard field for field and in order: status, result, total, search_params.
type Response struct {
	Status       StatusInfo     `json:"status"`
	Result       any            `json:"result,omitempty"`
	Total        *int           `json:"total,omitempty"`
	SearchParams map[string]any `json:"search_params,omitempty"`
}

func statusSuccess() StatusInfo {
	return StatusInfo{Code: 1000, Header: "Success", Description: "Success"}
}

func statusDuplicateError(entity string) StatusInfo {
	return StatusInfo{Code: 1799, Header: "Unable to proceed", Description: entity + " already exists"}
}

func statusDuplicateErrorMsg(message string) StatusInfo {
	return StatusInfo{Code: 1799, Header: "Unable to proceed", Description: message}
}

func statusGenericError() StatusInfo {
	return StatusInfo{Code: 1899, Header: "Unable to proceed", Description: "We cannot process your request at this moment. Please try again later."}
}

func statusValidationError(message string) StatusInfo {
	return StatusInfo{Code: 1801, Header: "Invalid request", Description: message}
}

func statusNotFoundError(entity string) StatusInfo {
	return StatusInfo{Code: 1802, Header: "Not found", Description: entity + " not found"}
}

func statusUnauthorizedError() StatusInfo {
	return StatusInfo{Code: 1803, Header: "Unauthorized", Description: "Invalid username or password"}
}

func statusServerError() StatusInfo {
	return StatusInfo{Code: 1900, Header: "Server error", Description: "An unexpected server error occurred. Please try again later."}
}

func statusInternalError() StatusInfo {
	return StatusInfo{Code: 1999, Header: "Internal Server Error", Description: "We cannot process your request at this moment."}
}

func SuccessResponse(result any) Response {
	return Response{Status: statusSuccess(), Result: result}
}

func SuccessWithTotal(result any, total int64) Response {
	t := int(total)
	return Response{Status: statusSuccess(), Result: result, Total: &t}
}

func SuccessWithSearchParams(result any, total int64, searchParams map[string]any) Response {
	t := int(total)
	return Response{Status: statusSuccess(), Result: result, Total: &t, SearchParams: searchParams}
}

func GenericErrorResponse() Response {
	return Response{Status: statusGenericError()}
}

func DuplicateErrorResponse(entity string) Response {
	return Response{Status: statusDuplicateError(entity)}
}

func DuplicateErrorResponseMsg(message string) Response {
	return Response{Status: statusDuplicateErrorMsg(message)}
}

func ValidationErrorResponse(message string) Response {
	return Response{Status: statusValidationError(message)}
}

func NotFoundErrorResponse(entity string) Response {
	return Response{Status: statusNotFoundError(entity)}
}

func UnauthorizedErrorResponse() Response {
	return Response{Status: statusUnauthorizedError()}
}

func ServerErrorResponse() Response {
	return Response{Status: statusServerError()}
}

func InternalErrorResponse() Response {
	return Response{Status: statusInternalError()}
}

// WriteJSON sends a JSON encoded API response envelope with content-type header.
func WriteJSON(w http.ResponseWriter, statusCode int, resp Response) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(resp)
}

