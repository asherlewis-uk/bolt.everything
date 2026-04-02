import Foundation

public enum APIClientError: LocalizedError {
    case invalidURLPath(String)
    case invalidResponse
    case requestFailed(statusCode: Int, body: String)

    public var errorDescription: String? {
        switch self {
        case .invalidURLPath(let path):
            return "Invalid API path: \(path)"
        case .invalidResponse:
            return "The server returned an invalid response."
        case .requestFailed(let statusCode, let body):
            return "Request failed with status \(statusCode): \(body)"
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

    private func makeRequest(path: String, method: String) throws -> URLRequest {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw APIClientError.invalidURLPath(path)
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
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

        guard (200..<300).contains(httpResponse.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw APIClientError.requestFailed(statusCode: httpResponse.statusCode, body: body)
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .useDefaultKeys
        return try decoder.decode(Response.self, from: data)
    }
}
