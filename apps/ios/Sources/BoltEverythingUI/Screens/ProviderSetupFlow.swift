import SwiftUI

public struct ProviderSetupFlow: View {
    @State private var viewModel: ProviderSetupFlowViewModel

    private let onCompleted: (CreateProviderProfileResponseDTO) -> Void

    public init(
        viewModel: ProviderSetupFlowViewModel,
        onCompleted: @escaping (CreateProviderProfileResponseDTO) -> Void
    ) {
        _viewModel = State(initialValue: viewModel)
        self.onCompleted = onCompleted
    }

    public var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.mint.opacity(0.22), Color.blue.opacity(0.10), Color.white],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Provider Setup")
                        .font(.largeTitle.bold())
                    Text("OpenAI-compatible chat models only. The user cannot skip validation in Phase 1.")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                stepHeader
                currentStepCard
                footerActions
            }
            .padding(24)
        }
    }

    private var stepHeader: some View {
        HStack(spacing: 12) {
            ForEach(ProviderSetupFlowViewModel.Step.allCases) { step in
                VStack(spacing: 8) {
                    Circle()
                        .fill(step.rawValue <= viewModel.step.rawValue ? Color.blue : Color.gray.opacity(0.25))
                        .frame(width: 12, height: 12)

                    Text(step.title)
                        .font(.caption)
                        .foregroundStyle(step == viewModel.step ? .primary : .secondary)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    @ViewBuilder
    private var currentStepCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            switch viewModel.step {
            case .preset:
                Picker("Preset", selection: $viewModel.selectedPreset) {
                    ForEach(ProviderPreset.allCases) { preset in
                        Text(preset.title).tag(preset)
                    }
                }
                .pickerStyle(.segmented)

                Text("The MVP supports only OpenAI, OpenRouter, and Custom OpenAI-compatible providers.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)

            case .credentials:
                TextField("Display name", text: $viewModel.displayName)
                    .textFieldStyle(.roundedBorder)

                if viewModel.selectedPreset == .custom {
                    TextField("Base URL", text: $viewModel.baseURL)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                } else {
                    LabeledContent("Resolved base URL") {
                        Text(viewModel.selectedPreset == .openai ? "https://api.openai.com/v1" : "https://openrouter.ai/api/v1")
                            .font(.footnote.monospaced())
                    }
                }

                SecureField("API key", text: $viewModel.apiKey)
                    .textFieldStyle(.roundedBorder)

            case .model:
                TextField("Default model", text: $viewModel.defaultModel)
                    .textFieldStyle(.roundedBorder)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()

                Text("Changing the provider or model affects future runs only.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)

            case .validation:
                LabeledContent("Preset") { Text(viewModel.selectedPreset.title) }
                LabeledContent("Display name") { Text(viewModel.displayName) }
                LabeledContent("Default model") { Text(viewModel.defaultModel) }
                LabeledContent("Base URL") { Text(viewModel.baseURL.isEmpty ? "Preset default" : viewModel.baseURL) }

                switch viewModel.validationState {
                case .idle:
                    Text("Run validation before this profile can be saved.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                case .validating:
                    ProgressView("Validating provider profile…")
                case .succeeded(let response):
                    Label("Validated at \(response.validatedAt)", systemImage: "checkmark.seal.fill")
                        .foregroundStyle(.green)
                case .failed(let message):
                    Label(message, systemImage: "xmark.octagon.fill")
                        .foregroundStyle(.red)
                }
            }
        }
        .padding(24)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
    }

    private var footerActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                if viewModel.step != .preset {
                    Button("Back") {
                        viewModel.goBack()
                    }
                    .buttonStyle(.bordered)
                }

                Spacer()

                switch viewModel.step {
                case .validation:
                    Button("Validate") {
                        Task { await viewModel.validate() }
                    }
                    .buttonStyle(.bordered)

                    Button(viewModel.isSaving ? "Saving…" : "Save Provider") {
                        Task { @MainActor in
                            do {
                                let profile = try await viewModel.saveProfile()
                                onCompleted(profile)
                            } catch {
                                viewModel.errorMessage = error.localizedDescription
                            }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(!viewModel.canAdvanceFromCurrentStep || viewModel.isSaving)
                default:
                    Button("Continue") {
                        viewModel.advance()
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(!viewModel.canAdvanceFromCurrentStep)
                }
            }

            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }
        }
    }
}
