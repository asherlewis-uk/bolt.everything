import Foundation
import Observation

@MainActor
@Observable
public final class AuthBootstrapViewModel {
    public enum Resolution: Equatable {
        case welcome
        case providerSetup
        case projectsList
    }

    public private(set) var didAttemptBootstrap = false
    public private(set) var isLoading = false
    public private(set) var errorMessage: String?

    @ObservationIgnored private let bootstrapService: any BootstrapServicing

    public init(bootstrapService: any BootstrapServicing) {
        self.bootstrapService = bootstrapService
    }

    public func load(force: Bool = false) async -> Resolution? {
        if didAttemptBootstrap && !force {
            return nil
        }

        didAttemptBootstrap = true
        isLoading = true
        errorMessage = nil

        do {
            let bootstrap = try await bootstrapService.loadBootstrap()
            isLoading = false
            return bootstrap.providerSetupRequired ? .providerSetup : .projectsList
        } catch {
            isLoading = false
            errorMessage = error.localizedDescription
            return nil
        }
    }
}
