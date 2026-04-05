import SwiftUI

public struct Phase1AppRoot: View {
    private let environment: AppEnvironment

    @State private var route: Phase1Route = .authBootstrap
    @State private var selectedProjectName: String?

    public init(environment: AppEnvironment = .preview) {
        self.environment = environment
    }

    public var body: some View {
        NavigationStack {
            currentScreen
                .navigationBarTitleDisplayMode(.inline)
        }
        .alert("Project Screen Starts In Phase 2", isPresented: Binding(
            get: { selectedProjectName != nil },
            set: { if !$0 { selectedProjectName = nil } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("The scaffold can list and create projects, but the project workspace shell is intentionally deferred until Phase 2.")
        }
    }

    @ViewBuilder
    private var currentScreen: some View {
        switch route {
        case .authBootstrap:
            AuthBootstrapScreen(
                viewModel: AuthBootstrapViewModel(bootstrapService: environment.bootstrapService),
                onWelcome: { route = .welcome },
                onProviderSetup: { route = .providerSetup },
                onProjectsList: { route = .projectsList },
                onSignIn: { route = .signIn }
            )
        case .welcome:
            WelcomeScreen {
                route = .signIn
            }
        case .signIn:
            SignInWithAppleScreen(apiClient: environment.apiClient) {
                route = .authBootstrap
            }
        case .providerSetup:
            ProviderSetupFlow(
                viewModel: ProviderSetupFlowViewModel(providerProfileService: environment.providerProfileService)
            ) { _ in
                route = .createProject
            }
        case .createProject:
            CreateProjectScreen(
                viewModel: CreateProjectViewModel(
                    providerProfileService: environment.providerProfileService,
                    projectService: environment.projectService
                )
            ) { _ in
                route = .projectsList
            }
        case .projectsList:
            ProjectsListScreen(
                viewModel: ProjectsListViewModel(projectService: environment.projectService),
                onCreateProject: { route = .createProject },
                onOpenProject: { project in
                    selectedProjectName = project.name
                }
            )
        }
    }
}
