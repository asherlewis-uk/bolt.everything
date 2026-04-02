import Foundation
import Observation

@MainActor
@Observable
public final class CreateProjectViewModel {
    public var name = ""
    public var goal = ""
    public var selectedTemplate: ProjectTemplateID = .reactVite
    public private(set) var providerProfiles: [ProviderProfileDTO] = []
    public var selectedProviderProfileId: String?
    public var selectedModelId = ""
    public private(set) var isLoading = false
    public private(set) var isCreating = false
    public var errorMessage: String?
    public private(set) var didLoad = false

    @ObservationIgnored private let providerProfileService: any ProviderProfileServicing
    @ObservationIgnored private let projectService: any ProjectServicing

    public init(
        providerProfileService: any ProviderProfileServicing,
        projectService: any ProjectServicing
    ) {
        self.providerProfileService = providerProfileService
        self.projectService = projectService
    }

    public func load(force: Bool = false) async {
        if didLoad && !force {
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            let profiles = try await providerProfileService.listProfiles()
            providerProfiles = profiles
            if selectedProviderProfileId == nil {
                selectedProviderProfileId = profiles.first(where: \.isDefault)?.id ?? profiles.first?.id
            }
            if selectedModelId.isEmpty, let selectedProfile = selectedProfile {
                selectedModelId = selectedProfile.defaultModel
            }
            didLoad = true
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    @discardableResult
    public func createProject() async throws -> CreateProjectResponseDTO {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedGoal = goal.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmedName.isEmpty else {
            throw CreateProjectError.nameRequired
        }

        guard !trimmedGoal.isEmpty else {
            throw CreateProjectError.goalRequired
        }

        isCreating = true
        defer { isCreating = false }

        let request = CreateProjectRequestDTO(
            name: trimmedName,
            goal: trimmedGoal,
            templateId: selectedTemplate,
            providerProfileId: selectedProviderProfileId,
            modelId: selectedModelId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : selectedModelId
        )

        return try await projectService.createProject(request)
    }

    public var selectedProfile: ProviderProfileDTO? {
        providerProfiles.first(where: { $0.id == selectedProviderProfileId })
    }
}

public enum CreateProjectError: LocalizedError {
    case nameRequired
    case goalRequired

    public var errorDescription: String? {
        switch self {
        case .nameRequired:
            return "Project name is required."
        case .goalRequired:
            return "Project goal is required."
        }
    }
}
