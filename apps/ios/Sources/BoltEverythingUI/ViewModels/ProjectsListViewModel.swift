import Foundation
import Observation

@MainActor
@Observable
public final class ProjectsListViewModel {
    public private(set) var projects: [ProjectSummaryDTO] = []
    public private(set) var isLoading = false
    public private(set) var errorMessage: String?
    public private(set) var didLoad = false

    @ObservationIgnored private let projectService: any ProjectServicing

    public init(projectService: any ProjectServicing) {
        self.projectService = projectService
    }

    public func reload(force: Bool = false) async {
        if didLoad && !force {
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            projects = try await projectService.listProjects()
            didLoad = true
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}
