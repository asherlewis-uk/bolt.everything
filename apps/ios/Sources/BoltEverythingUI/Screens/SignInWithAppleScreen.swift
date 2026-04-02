import SwiftUI

public struct SignInWithAppleScreen: View {
    private let onSignedIn: () -> Void

    public init(onSignedIn: @escaping () -> Void) {
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

                Text("Phase 1 keeps Sign in with Apple as the only auth path. The real credential exchange, nonce handling, and backend session binding are still marked TODO in this skeleton.")
                    .font(.body)
                    .foregroundStyle(.white.opacity(0.75))
                    .multilineTextAlignment(.center)

                Button {
                    // TODO: Replace this placeholder action with ASAuthorizationAppleID flow
                    // and backend session bootstrap once auth wiring is implemented.
                    onSignedIn()
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "apple.logo")
                        Text("Sign in with Apple")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                }
                .buttonStyle(.borderedProminent)
                .tint(.white)
                .foregroundStyle(.black)

                Spacer()
            }
            .padding(24)
        }
    }
}
