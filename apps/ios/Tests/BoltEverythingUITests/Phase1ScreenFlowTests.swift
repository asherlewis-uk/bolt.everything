import XCTest
@testable import BoltEverythingUI

@MainActor
final class Phase1ScreenFlowTests: XCTestCase {
    func testBootstrapRoutesToProviderSetupWhenRequired() async {
        let viewModel = AuthBootstrapViewModel(
            bootstrapService: MockBootstrapService(
                response: BootstrapResponseDTO(
                    user: BootstrapUserDTO(id: "usr_123", defaultProviderProfileId: nil),
                    providerSetupRequired: true,
                    recentProjects: []
                )
            )
        )

        let resolution = await viewModel.load()
        XCTAssertEqual(resolution, .providerSetup)
    }

    func testProviderSetupValidatesAndPersistsProfile() async throws {
        let viewModel = ProviderSetupFlowViewModel(
            providerProfileService: MockProviderProfileService()
        )

        viewModel.apiKey = "sk-phase1"
        viewModel.defaultModel = "gpt-4.1"
        viewModel.step = .validation

        await viewModel.validate()
        let profile = try await viewModel.saveProfile()

        XCTAssertEqual(profile.displayName, "OpenAI")
        XCTAssertEqual(profile.status, .validated)
    }

    func testCreateProjectLoadsDefaultProviderAndCreatesProject() async throws {
        let viewModel = CreateProjectViewModel(
            providerProfileService: MockProviderProfileService(),
            projectService: MockProjectService()
        )

        await viewModel.load()
        viewModel.name = "Travel App"
        viewModel.goal = "Build a premium travel startup landing page."

        let project = try await viewModel.createProject()
        XCTAssertEqual(project.templateId, .reactVite)
        XCTAssertEqual(project.status, .ready)
    }
}

private struct MockBootstrapService: BootstrapServicing {
    let response: BootstrapResponseDTO

    func loadBootstrap() async throws -> BootstrapResponseDTO {
        response
    }
}

private struct MockProviderProfileService: ProviderProfileServicing {
    func listProfiles() async throws -> [ProviderProfileDTO] {
        [
            ProviderProfileDTO(
                id: "prov_123",
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
            id: "prov_123",
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

private struct MockProjectService: ProjectServicing {
    func listProjects() async throws -> [ProjectSummaryDTO] {
        []
    }

    func createProject(_ request: CreateProjectRequestDTO) async throws -> CreateProjectResponseDTO {
        CreateProjectResponseDTO(
            id: "prj_123",
            name: request.name,
            goal: request.goal,
            templateId: request.templateId,
            status: .ready,
            conversationId: "cnv_123",
            providerProfileId: request.providerProfileId,
            modelId: request.modelId,
            createdAt: "2026-04-01T18:10:00Z"
        )
    }
}
