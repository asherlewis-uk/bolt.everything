import Foundation

public enum ProviderKind: String, Codable, Sendable {
    case openAICompatible = "openai_compatible"
}

public enum ProviderPreset: String, Codable, CaseIterable, Identifiable, Sendable {
    case openai
    case openrouter
    case custom

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .openai:
            return "OpenAI"
        case .openrouter:
            return "OpenRouter"
        case .custom:
            return "Custom"
        }
    }
}

public enum ProviderProfileStatus: String, Codable, Sendable {
    case pendingValidation = "pending_validation"
    case validated
    case validationFailed = "validation_failed"
}

public enum ProjectTemplateID: String, Codable, CaseIterable, Identifiable, Sendable {
    case reactVite = "react_vite"
    case nextjs
    case nodeTypescript = "node_typescript"

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .reactVite:
            return "React + Vite"
        case .nextjs:
            return "Next.js"
        case .nodeTypescript:
            return "Empty Node + TypeScript"
        }
    }
}

public enum ProjectStatus: String, Codable, Sendable {
    case creating
    case ready
    case running
    case needsAttention = "needs_attention"
    case archived
}

public struct BootstrapUserDTO: Codable, Equatable, Sendable {
    public let id: String
    public let defaultProviderProfileId: String?
}

public struct RecentProjectSummaryDTO: Codable, Equatable, Identifiable, Sendable {
    public let id: String
    public let name: String
    public let status: ProjectStatus
    public let updatedAt: String
}

public struct BootstrapResponseDTO: Codable, Equatable, Sendable {
    public let user: BootstrapUserDTO
    public let providerSetupRequired: Bool
    public let recentProjects: [RecentProjectSummaryDTO]
}

public struct ProviderProfileDTO: Codable, Equatable, Identifiable, Sendable {
    public let id: String
    public let kind: ProviderKind
    public let preset: ProviderPreset
    public let displayName: String
    public let baseUrl: String?
    public let defaultModel: String
    public let validatedAt: String?
    public let status: ProviderProfileStatus
    public let isDefault: Bool
}

public struct ProviderProfileValidationRequestDTO: Codable, Equatable, Sendable {
    public let kind: ProviderKind
    public let preset: ProviderPreset
    public let displayName: String
    public let baseUrl: String?
    public let apiKey: String
    public let defaultModel: String
}

public struct ProviderProfileValidationResponseDTO: Codable, Equatable, Sendable {
    public let valid: Bool
    public let resolvedBaseUrl: String?
    public let resolvedModel: String
    public let validatedAt: String
}

public struct CreateProviderProfileRequestDTO: Codable, Equatable, Sendable {
    public let kind: ProviderKind
    public let preset: ProviderPreset
    public let displayName: String
    public let baseUrl: String?
    public let apiKey: String
    public let defaultModel: String
}

public struct CreateProviderProfileResponseDTO: Codable, Equatable, Sendable {
    public let id: String
    public let kind: ProviderKind
    public let preset: ProviderPreset
    public let displayName: String
    public let baseUrl: String?
    public let defaultModel: String
    public let validatedAt: String?
    public let status: ProviderProfileStatus
}

public struct ProjectSummaryDTO: Codable, Equatable, Identifiable, Sendable {
    public let id: String
    public let name: String
    public let goal: String
    public let templateId: ProjectTemplateID
    public let status: ProjectStatus
    public let providerProfileId: String?
    public let modelId: String?
    public let updatedAt: String
    public let lastMessageAt: String?
}

public struct CreateProjectRequestDTO: Codable, Equatable, Sendable {
    public let name: String
    public let goal: String
    public let templateId: ProjectTemplateID
    public let providerProfileId: String?
    public let modelId: String?
}

public struct CreateProjectResponseDTO: Codable, Equatable, Identifiable, Sendable {
    public let id: String
    public let name: String
    public let goal: String
    public let templateId: ProjectTemplateID
    public let status: ProjectStatus
    public let conversationId: String
    public let providerProfileId: String?
    public let modelId: String?
    public let createdAt: String
}
