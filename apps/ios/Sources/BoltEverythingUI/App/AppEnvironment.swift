import Foundation

public struct AppEnvironment {
    public var apiClient: APIClient
    public var bootstrapService: any BootstrapServicing
    public var providerProfileService: any ProviderProfileServicing
    public var projectService: any ProjectServicing

    public init(
        apiClient: APIClient,
        bootstrapService: any BootstrapServicing,
        providerProfileService: any ProviderProfileServicing,
        projectService: any ProjectServicing
    ) {
        self.apiClient = apiClient
        self.bootstrapService = bootstrapService
        self.providerProfileService = providerProfileService
        self.projectService = projectService
    }

    public static func live(baseURL: URL) -> AppEnvironment {
        let apiClient = APIClient(baseURL: baseURL)
        return AppEnvironment(
            apiClient: apiClient,
            bootstrapService: LiveBootstrapService(apiClient: apiClient),
            providerProfileService: LiveProviderProfileService(apiClient: apiClient),
            projectService: LiveProjectService(apiClient: apiClient)
        )
    }

    public static let preview = AppEnvironment(
        apiClient: APIClient(baseURL: URL(string: "http://localhost:3000")!),
        bootstrapService: PreviewBootstrapService(),
        providerProfileService: PreviewProviderProfileService(),
        projectService: PreviewProjectService()
    )
}

private struct PreviewBootstrapService: BootstrapServicing {
    func loadBootstrap() async throws -> BootstrapResponseDTO {
        BootstrapResponseDTO(
            user: BootstrapUserDTO(id: "usr_preview", defaultProviderProfileId: "prov_preview"),
            providerSetupRequired: false,
            recentProjects: [
                RecentProjectSummaryDTO(
                    id: "prj_preview",
                    name: "Travel App",
                    status: .ready,
                    updatedAt: "2026-04-01T18:00:00Z"
                )
            ]
        )
    }
}

private struct PreviewProviderProfileService: ProviderProfileServicing {
    func listProfiles() async throws -> [ProviderProfileDTO] {
        [
            ProviderProfileDTO(
                id: "prov_preview",
                kind: .openAICompatible,
                preset: .openai,
                displayName: "OpenAI",
                baseUrl: "https://api.openai.com/v1",
                defaultModel: "gpt-4.1",
                validatedAt: "2026-04-01T18:00:00Z",
                status: .validated,
                isDefault: true
            )
        ]
    }

    func validateProfile(_ request: ProviderProfileValidationRequestDTO) async throws -> ProviderProfileValidationResponseDTO {
        ProviderProfileValidationResponseDTO(
            valid: true,
            resolvedBaseUrl: request.baseUrl ?? "https://api.openai.com/v1",
            resolvedModel: request.defaultModel,
            validatedAt: "2026-04-01T18:05:00Z"
        )
    }

    func createProfile(_ request: CreateProviderProfileRequestDTO) async throws -> CreateProviderProfileResponseDTO {
        CreateProviderProfileResponseDTO(
            id: "prov_preview",
            kind: request.kind,
            preset: request.preset,
            displayName: request.displayName,
            baseUrl: request.baseUrl ?? "https://api.openai.com/v1",
            defaultModel: request.defaultModel,
            validatedAt: "2026-04-01T18:06:00Z",
            status: .validated
        )
    }
}

private struct PreviewProjectService: ProjectServicing {
    func listProjects() async throws -> [ProjectSummaryDTO] {
        [
            ProjectSummaryDTO(
                id: "prj_preview",
                name: "Travel App",
                goal: "Build a premium travel startup landing page.",
                templateId: .reactVite,
                status: .ready,
                providerProfileId: "prov_preview",
                modelId: "gpt-4.1",
                updatedAt: "2026-04-01T18:10:00Z",
                lastMessageAt: nil
            )
        ]
    }

    func createProject(_ request: CreateProjectRequestDTO) async throws -> CreateProjectResponseDTO {
        CreateProjectResponseDTO(
            id: "prj_created",
            name: request.name,
            goal: request.goal,
            templateId: request.templateId,
            status: .ready,
            conversationId: "cnv_created",
            providerProfileId: request.providerProfileId,
            modelId: request.modelId,
            createdAt: "2026-04-01T18:10:00Z"
        )
    }
}
