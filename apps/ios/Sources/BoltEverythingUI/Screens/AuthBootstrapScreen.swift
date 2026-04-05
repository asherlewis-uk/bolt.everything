import SwiftUI

public struct AuthBootstrapScreen: View {
    @State private var viewModel: AuthBootstrapViewModel

    private let onWelcome: () -> Void
    private let onProviderSetup: () -> Void
    private let onProjectsList: () -> Void
    private let onSignIn: () -> Void

    public init(
        viewModel: AuthBootstrapViewModel,
        onWelcome: @escaping () -> Void,
        onProviderSetup: @escaping () -> Void,
        onProjectsList: @escaping () -> Void,
        onSignIn: @escaping () -> Void
    ) {
        _viewModel = State(initialValue: viewModel)
        self.onWelcome = onWelcome
        self.onProviderSetup = onProviderSetup
        self.onProjectsList = onProjectsList
        self.onSignIn = onSignIn
    }

    public var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.blue.opacity(0.22), Color.cyan.opacity(0.12), Color.white],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 20) {
                Text("Preparing bolt.everything")
                    .font(.largeTitle.bold())
                    .multilineTextAlignment(.center)

                Text("Loading the session bootstrap so the app can route to provider setup or the project list without a blank slate.")
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)

                Group {
                    if let errorMessage = viewModel.errorMessage {
                        VStack(alignment: .leading, spacing: 12) {
                            Label("Bootstrap failed", systemImage: "exclamationmark.triangle.fill")
                                .font(.headline)
                                .foregroundStyle(.orange)

                            Text(errorMessage)
                                .font(.footnote)
                                .foregroundStyle(.secondary)

                            HStack {
                                Button("Retry") {
                                    Task { await resolve(force: true) }
                                }
                                .buttonStyle(.borderedProminent)

                                Button("Go to Welcome", action: onWelcome)
                                    .buttonStyle(.bordered)
                            }
                        }
                    } else {
                        VStack(spacing: 12) {
                            ProgressView()
                                .controlSize(.large)

                            Text(viewModel.isLoading ? "Contacting /v1/bootstrap..." : "Waiting to route.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(24)
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
            }
            .padding(24)
        }
        .task {
            await resolve(force: false)
        }
    }

    private func resolve(force: Bool) async {
        let resolution = await viewModel.load(force: force)

        switch resolution {
        case .welcome:
            onWelcome()
        case .signIn:
            onSignIn()
        case .providerSetup:
            onProviderSetup()
        case .projectsList:
            onProjectsList()
        case nil:
            break
        }
    }
}
