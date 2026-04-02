import SwiftUI

public struct CreateProjectScreen: View {
    @State private var viewModel: CreateProjectViewModel

    private let onProjectCreated: (CreateProjectResponseDTO) -> Void

    public init(
        viewModel: CreateProjectViewModel,
        onProjectCreated: @escaping (CreateProjectResponseDTO) -> Void
    ) {
        _viewModel = State(initialValue: viewModel)
        self.onProjectCreated = onProjectCreated
    }

    public var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.orange.opacity(0.24), Color.yellow.opacity(0.12), Color.white],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Create First Project")
                        .font(.largeTitle.bold())

                    Text("Every project starts from a locked starter template. There is no import flow and no template-free path in the MVP.")
                        .foregroundStyle(.secondary)

                    VStack(alignment: .leading, spacing: 16) {
                        TextField("Project name", text: $viewModel.name)
                            .textFieldStyle(.roundedBorder)

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Starter template")
                                .font(.headline)

                            Picker("Starter template", selection: $viewModel.selectedTemplate) {
                                ForEach(ProjectTemplateID.allCases) { template in
                                    Text(template.title).tag(template)
                                }
                            }
                            .pickerStyle(.segmented)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Project goal")
                                .font(.headline)

                            TextEditor(text: $viewModel.goal)
                                .frame(minHeight: 120)
                                .padding(8)
                                .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        }

                        if viewModel.isLoading {
                            ProgressView("Loading validated providers…")
                        } else if !viewModel.providerProfiles.isEmpty {
                            Picker("Provider", selection: Binding(
                                get: { viewModel.selectedProviderProfileId ?? "" },
                                set: { viewModel.selectedProviderProfileId = $0.isEmpty ? nil : $0 }
                            )) {
                                ForEach(viewModel.providerProfiles) { profile in
                                    Text(profile.displayName).tag(profile.id)
                                }
                            }
                            .pickerStyle(.menu)

                            TextField("Model", text: $viewModel.selectedModelId)
                                .textFieldStyle(.roundedBorder)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        }
                    }
                    .padding(24)
                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))

                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }

                    Button(viewModel.isCreating ? "Creating…" : "Create Project") {
                        Task { @MainActor in
                            do {
                                let project = try await viewModel.createProject()
                                onProjectCreated(project)
                            } catch {
                                viewModel.errorMessage = error.localizedDescription
                            }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(viewModel.isCreating)
                }
                .padding(24)
            }
        }
        .task {
            await viewModel.load()
        }
    }
}
