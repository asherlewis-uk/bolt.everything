import Foundation

public protocol ProviderProfileServicing {
    func listProfiles() async throws -> [ProviderProfileDTO]
    func validateProfile(_ request: ProviderProfileValidationRequestDTO) async throws -> ProviderProfileValidationResponseDTO
    func createProfile(_ request: CreateProviderProfileRequestDTO) async throws -> CreateProviderProfileResponseDTO
}

public struct LiveProviderProfileService: ProviderProfileServicing {
    private let apiClient: APIClient

    public init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    public func listProfiles() async throws -> [ProviderProfileDTO] {
        try await apiClient.get("/v1/provider-profiles", as: [ProviderProfileDTO].self)
    }

    public func validateProfile(_ request: ProviderProfileValidationRequestDTO) async throws -> ProviderProfileValidationResponseDTO {
        try await apiClient.send(
            "/v1/provider-profiles/validate",
            method: "POST",
            body: request,
            as: ProviderProfileValidationResponseDTO.self
        )
    }

    public func createProfile(_ request: CreateProviderProfileRequestDTO) async throws -> CreateProviderProfileResponseDTO {
        try await apiClient.send(
            "/v1/provider-profiles",
            method: "POST",
            body: request,
            as: CreateProviderProfileResponseDTO.self
        )
    }
}
