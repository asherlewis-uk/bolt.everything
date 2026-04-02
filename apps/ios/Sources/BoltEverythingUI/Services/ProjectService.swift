import Foundation

public protocol ProjectServicing {
    func listProjects() async throws -> [ProjectSummaryDTO]
    func createProject(_ request: CreateProjectRequestDTO) async throws -> CreateProjectResponseDTO
}

public struct LiveProjectService: ProjectServicing {
    private let apiClient: APIClient

    public init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    public func listProjects() async throws -> [ProjectSummaryDTO] {
        try await apiClient.get("/v1/projects", as: [ProjectSummaryDTO].self)
    }

    public func createProject(_ request: CreateProjectRequestDTO) async throws -> CreateProjectResponseDTO {
        try await apiClient.send(
            "/v1/projects",
            method: "POST",
            body: request,
            as: CreateProjectResponseDTO.self
        )
    }
}
