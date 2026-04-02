import Foundation
import Observation

@MainActor
@Observable
public final class ProviderSetupFlowViewModel {
    public enum Step: Int, CaseIterable, Identifiable {
        case preset
        case credentials
        case model
        case validation

        public var id: Int { rawValue }

        public var title: String {
            switch self {
            case .preset:
                return "Preset"
            case .credentials:
                return "Credentials"
            case .model:
                return "Model"
            case .validation:
                return "Validation"
            }
        }
    }

    public enum ValidationState: Equatable {
        case idle
        case validating
        case succeeded(ProviderProfileValidationResponseDTO)
        case failed(String)
    }

    public var step: Step = .preset
    public var selectedPreset: ProviderPreset = .openai {
        didSet { applyPresetDefaults() }
    }
    public var displayName = "OpenAI"
    public var baseURL = ""
    public var apiKey = ""
    public var defaultModel = "gpt-4.1"
    public private(set) var validationState: ValidationState = .idle
    public private(set) var isSaving = false
    public private(set) var savedProfile: CreateProviderProfileResponseDTO?
    public var errorMessage: String?

    @ObservationIgnored private let providerProfileService: any ProviderProfileServicing

    public init(providerProfileService: any ProviderProfileServicing) {
        self.providerProfileService = providerProfileService
        applyPresetDefaults()
    }

    public func advance() {
        guard let next = Step(rawValue: step.rawValue + 1) else { return }
        step = next
    }

    public func goBack() {
        guard let previous = Step(rawValue: step.rawValue - 1) else { return }
        step = previous
    }

    public func validate() async {
        validationState = .validating
        errorMessage = nil

        do {
            let response = try await providerProfileService.validateProfile(validationRequest)
            validationState = .succeeded(response)
        } catch {
            let message = error.localizedDescription
            validationState = .failed(message)
            errorMessage = message
        }
    }

    @discardableResult
    public func saveProfile() async throws -> CreateProviderProfileResponseDTO {
        guard case .succeeded = validationState else {
            throw ProviderSetupError.validationRequired
        }

        isSaving = true
        defer { isSaving = false }

        let request = CreateProviderProfileRequestDTO(
            kind: .openAICompatible,
            preset: selectedPreset,
            displayName: displayName,
            baseUrl: normalizedBaseURL,
            apiKey: apiKey.trimmingCharacters(in: .whitespacesAndNewlines),
            defaultModel: defaultModel.trimmingCharacters(in: .whitespacesAndNewlines)
        )

        let profile = try await providerProfileService.createProfile(request)
        savedProfile = profile
        return profile
    }

    public var canAdvanceFromCurrentStep: Bool {
        switch step {
        case .preset:
            return true
        case .credentials:
            return !displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                && !apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        case .model:
            return !defaultModel.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        case .validation:
            if case .succeeded = validationState {
                return true
            }
            return false
        }
    }

    private var normalizedBaseURL: String? {
        let trimmed = baseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private var validationRequest: ProviderProfileValidationRequestDTO {
        ProviderProfileValidationRequestDTO(
            kind: .openAICompatible,
            preset: selectedPreset,
            displayName: displayName,
            baseUrl: normalizedBaseURL,
            apiKey: apiKey.trimmingCharacters(in: .whitespacesAndNewlines),
            defaultModel: defaultModel.trimmingCharacters(in: .whitespacesAndNewlines)
        )
    }

    private func applyPresetDefaults() {
        switch selectedPreset {
        case .openai:
            displayName = "OpenAI"
            baseURL = ""
        case .openrouter:
            displayName = "OpenRouter"
            baseURL = ""
        case .custom:
            displayName = "Custom Gateway"
            if baseURL.isEmpty {
                baseURL = "https://example.com/v1"
            }
        }

        validationState = .idle
    }
}

public enum ProviderSetupError: LocalizedError {
    case validationRequired

    public var errorDescription: String? {
        switch self {
        case .validationRequired:
            return "Validate the provider profile before saving it."
        }
    }
}
