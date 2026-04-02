import Foundation

public protocol BootstrapServicing {
    func loadBootstrap() async throws -> BootstrapResponseDTO
}

public struct LiveBootstrapService: BootstrapServicing {
    private let apiClient: APIClient

    public init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    public func loadBootstrap() async throws -> BootstrapResponseDTO {
        try await apiClient.get("/v1/bootstrap", as: BootstrapResponseDTO.self)
    }
}
