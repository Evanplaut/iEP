import SwiftUI

struct MenuBarView: View {
    @ObservedObject var usageService: UsageService
    @ObservedObject var settingsManager: SettingsManager
    @State private var showSettings = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Usage header
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Image(systemName: usageIconName)
                        .foregroundColor(usageColor)
                    Text("5hr: \(usageService.currentUsage.fiveHourUtilization)%")
                        .font(.system(.body, design: .monospaced))
                    Spacer()
                    if let reset = usageService.currentUsage.fiveHourResetIn {
                        Text("resets in \(reset)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                HStack {
                    Image(systemName: "calendar")
                        .foregroundColor(weeklyColor)
                    Text("Week: \(usageService.currentUsage.sevenDayUtilization)%")
                        .font(.system(.body, design: .monospaced))
                    Spacer()
                    if let reset = usageService.currentUsage.sevenDayResetIn {
                        Text("resets in \(reset)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            // Loading / Error state
            if usageService.isLoading {
                HStack {
                    ProgressView()
                        .scaleEffect(0.7)
                    Text("Updating...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else if let error = usageService.error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.orange)
                    .lineLimit(2)
            }

            // Model breakdown
            if let sonnet = usageService.currentUsage.sevenDaySonnetUtilization {
                Divider()
                HStack {
                    Text("Sonnet 7d:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(sonnet)%")
                        .font(.caption)
                }
            }

            Divider()

            // Action buttons
            Button(action: openDashboard) {
                Label("Open Dashboard", systemImage: "chart.bar.xaxis")
            }
            .buttonStyle(.borderless)

            Button(action: refreshUsage) {
                Label("Refresh", systemImage: "arrow.clockwise")
            }
            .buttonStyle(.borderless)

            Button(action: { showSettings = true }) {
                Label("Settings", systemImage: "gear")
            }
            .buttonStyle(.borderless)
            .sheet(isPresented: $showSettings) {
                SettingsView(settingsManager: settingsManager, usageService: usageService)
            }

            Divider()

            Button(action: quitApp) {
                Label("Quit", systemImage: "power")
            }
            .buttonStyle(.borderless)
        }
        .padding()
        .frame(minWidth: 200)
    }

    // MARK: - Computed Properties

    private var usageIconName: String {
        let pct = usageService.currentUsage.fiveHourUtilization
        if pct >= 80 { return "exclamationmark.triangle.fill" }
        if pct >= 50 { return "chart.pie.fill" }
        return "chart.pie"
    }

    private var usageColor: Color {
        let pct = usageService.currentUsage.fiveHourUtilization
        if pct >= 90 { return .red }
        if pct >= 70 { return .orange }
        return .primary
    }

    private var weeklyColor: Color {
        let pct = Double(usageService.currentUsage.sevenDayUtilization)
        if pct >= settingsManager.settings.criticalThreshold { return .red }
        if pct >= settingsManager.settings.warningThreshold { return .orange }
        return .primary
    }

    // MARK: - Actions

    private func openDashboard() {
        if let url = URL(string: "https://console.anthropic.com/settings/usage") {
            NSWorkspace.shared.open(url)
        }
    }

    private func refreshUsage() {
        usageService.fetchUsage()
    }

    private func quitApp() {
        NSApplication.shared.terminate(nil)
    }
}
