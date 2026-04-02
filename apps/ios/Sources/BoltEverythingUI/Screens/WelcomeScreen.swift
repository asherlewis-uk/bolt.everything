import SwiftUI

public struct WelcomeScreen: View {
    private let onContinue: () -> Void

    public init(onContinue: @escaping () -> Void) {
        self.onContinue = onContinue
    }

    public var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.indigo.opacity(0.9), Color.blue.opacity(0.72), Color.cyan.opacity(0.5)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 24) {
                Spacer()

                Text("Build and modify real projects from your iPhone through chat.")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)

                VStack(alignment: .leading, spacing: 12) {
                    Label("Projects are persistent.", systemImage: "internaldrive.fill")
                    Label("A validated model provider is required before the first run.", systemImage: "lock.shield.fill")
                }
                .font(.headline)
                .foregroundStyle(.white.opacity(0.92))

                Button("Continue") {
                    onContinue()
                }
                .buttonStyle(.borderedProminent)
                .tint(.white)
                .foregroundStyle(.indigo)

                Spacer()
            }
            .padding(28)
        }
    }
}
