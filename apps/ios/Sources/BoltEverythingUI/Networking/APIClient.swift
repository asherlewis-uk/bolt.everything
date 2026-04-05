import Foundation

public enum APIClientError: LocalizedError {
    case invalidURLPath(String)
    case invalidResponse
    /// The server returned a non-2xx, non-401 status.
    case requestFailed(statusCode: Int, message: String)
    /// Session has expired or was never established — caller should sign out.
    case unauthorized

    public var errorDescription: String? {
        switch self {
        case .invalidURLPath(let path):
            return "Invalid API path: \(path)"
        case .invalidResponse:
            return "The server returned an invalid response."
        case .requestFailed(_, let message):
            return message
        case .unauthorized:
            return "Your session has expired. Please sign in again."
        }
    }
}

public struct APIClient {
    public let baseURL: URL
    public let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func get<Response: Decodable>(_ path: String, as responseType: Response.Type) async throws -> Response {
        var request = try makeRequest(path: path, method: "GET")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let (data, response) = try await session.data(for: request)
        return try decode(Response.self, data: data, response: response)
    }

    public func send<Request: Encodable, Response: Decodable>(
        _ path: String,
        method: String,
        body: Request,
        as responseType: Response.Type
    ) async throws -> Response {
        var request = try makeRequest(path: path, method: method)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        let (data, response) = try await session.data(for: request)
        return try decode(Response.self, data: data, response: response)
    }

    // MARK: - Private

    private func makeRequest(path: String, method: String) throws -> URLRequest {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw APIClientError.invalidURLPath(path)
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        // The session cookie (bolt_session) is sent automatically via URLSession's
        // HTTPCookieStorage.  No manual injection needed.
        return request
    }

    private func decode<Response: Decodable>(
        _ responseType: Response.Type,
        data: Data,
        response: URLResponse
    ) throws -> Response {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }

        if httpResponse.statusCode == 401 {
            throw APIClientError.unauthorized
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            // Extract the "message" field from the standard error envelope if present.
            let message = extractErrorMessage(from: data) ?? "Request failed (\(httpResponse.statusCode))."
            throw APIClientError.requestFailed(statusCode: httpResponse.statusCode, message: message)
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .useDefaultKeys
        return try decoder.decode(Response.self, from: data)
    }

    private func extractErrorMessage(from data: Data) -> String? {
        struct ErrorEnvelope: Decodable {
            struct ErrorBody: Decodable { let message: String }
            let error: ErrorBody
        }
        return (try? JSONDecoder().decode(ErrorEnvelope.self, from: data))?.error.message
    }
}
