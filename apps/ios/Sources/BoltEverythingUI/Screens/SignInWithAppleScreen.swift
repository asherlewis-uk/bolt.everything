import AuthenticationServices
import SwiftUI

/// Sign in with Apple screen.
///
/// Uses ASAuthorizationAppleIDProvider to perform the real credential exchange,
/// then sends the identity token to the backend to establish a session.
public struct SignInWithAppleScreen: View {
    private let onSignedIn: () -> Void
    private let apiClient: APIClient

    @State private var errorMessage: String? = nil
    @State private var isLoading = false

    public init(apiClient: APIClient, onSignedIn: @escaping () -> Void) {
        self.apiClient = apiClient
        self.onSignedIn = onSignedIn
    }

    public var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                Image(systemName: "apple.logo")
                    .font(.system(size: 48, weight: .semibold))
                    .foregroundStyle(.white)

                Text("Sign in with Apple")
                    .font(.largeTitle.bold())
                    .foregroundStyle(.white)

                Text("Your projects are private. Sign in to get started.")
                    .font(.body)
                    .foregroundStyle(.white.opacity(0.75))
                    .multilineTextAlignment(.center)

                if let errorMessage {
                    Text(errorMessage)
                        .font(.callout)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }

                SignInWithAppleButton(.signIn) { request in
                    request.requestedScopes = [.email]
                    // TODO: Set request.nonce to a SHA-256 hash of a locally generated
                    // random nonce before going to production, to prevent replay attacks.
                } onCompletion: { result in
                    Task { await handleCompletion(result) }
                }
                .signInWithAppleButtonStyle(.white)
                .frame(height: 50)
                .disabled(isLoading)

                Spacer()
            }
            .padding(24)
        }
    }

    // MARK: - Private

    @MainActor
    private func handleCompletion(
        _ result: Result<ASAuthorization, Error>
    ) async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }

        switch result {
        case .failure(let error):
            if (error as? ASAuthorizationError)?.code == .canceled { return }
            errorMessage = error.localizedDescription
        case .success(let authorization):
            guard
                let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                let tokenData = credential.identityToken,
                let identityToken = String(data: tokenData, encoding: .utf8)
            else {
                errorMessage = "Could not read Apple credential. Please try again."
                return
            }

            do {
                let response = try await apiClient.send(
                    "/v1/auth/apple",
                    method: "POST",
                    body: AppleSignInRequestDTO(identityToken: identityToken),
                    as: AppleSignInResponseDTO.self
                )
                try KeychainService.saveSessionUserId(response.userId)
                onSignedIn()
            } catch {
                errorMessage = "Sign in failed. Please try again."
            }
        }
    }
}

// MARK: - DTOs

private struct AppleSignInRequestDTO: Encodable {
    let identityToken: String
}

private struct AppleSignInResponseDTO: Decodable {
    let userId: String
}
