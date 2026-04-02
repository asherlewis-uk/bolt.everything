import SwiftUI

public struct ProjectsListScreen: View {
    @State private var viewModel: ProjectsListViewModel

    private let onCreateProject: () -> Void
    private let onOpenProject: (ProjectSummaryDTO) -> Void

    public init(
        viewModel: ProjectsListViewModel,
        onCreateProject: @escaping () -> Void,
        onOpenProject: @escaping (ProjectSummaryDTO) -> Void
    ) {
        _viewModel = State(initialValue: viewModel)
        self.onCreateProject = onCreateProject
        self.onOpenProject = onOpenProject
    }

    public var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.teal.opacity(0.22), Color.blue.opacity(0.08), Color.white],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 20) {
                HStack {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Projects")
                            .font(.largeTitle.bold())
                        Text("One project, one conversation, one active run.")
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Button("New Project", action: onCreateProject)
                        .buttonStyle(.borderedProminent)
                }

                if viewModel.isLoading {
                    Spacer()
                    ProgressView("Loading projects…")
                    Spacer()
                } else if let errorMessage = viewModel.errorMessage {
                    Spacer()
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Couldn’t load projects")
                            .font(.headline)
                        Text(errorMessage)
                            .foregroundStyle(.secondary)
                        Button("Retry") {
                            Task { await viewModel.reload(force: true) }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    Spacer()
                } else if viewModel.projects.isEmpty {
                    Spacer()
                    VStack(alignment: .leading, spacing: 12) {
                        Text("No projects yet")
                            .font(.headline)
                        Text("Create a starter-template project to begin the locked MVP flow.")
                            .foregroundStyle(.secondary)
                        Button("Create First Project", action: onCreateProject)
                            .buttonStyle(.borderedProminent)
                    }
                    Spacer()
                } else {
                    List(viewModel.projects) { project in
                        Button {
                            onOpenProject(project)
                        } label: {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text(project.name)
                                        .font(.headline)
                                    Spacer()
                                    Text(project.status.rawValue.replacingOccurrences(of: "_", with: " "))
                                        .font(.caption.weight(.semibold))
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 6)
                                        .background(Color.blue.opacity(0.12), in: Capsule())
                                }

                                Text(project.goal)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)

                                HStack {
                                    Text(project.templateId.title)
                                    Spacer()
                                    Text(project.updatedAt)
                                }
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 6)
                        }
                        .buttonStyle(.plain)
                    }
                    .listStyle(.plain)

                    Text("Project detail, chat, diffs, files, and preview land in Phase 2. This list only reopens project summaries in the scaffold.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(24)
        }
        .task {
            await viewModel.reload()
        }
    }
}
