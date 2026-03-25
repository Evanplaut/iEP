import AppKit
import SwiftUI
import UserNotifications
import Combine

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem!
    private var popover: NSPopover!
    private let usageService = UsageService.shared
    private let settingsManager = SettingsManager.shared
    private var lastWarningNotified: Int = 0
    private var lastCriticalNotified: Int = 0
    private var cancellables = Set<AnyCancellable>()

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupStatusItem()
        setupPopover()
        setupNotifications()
        startUsagePolling()

        // Observe usage changes
        usageService.$currentUsage
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in self?.usageDidUpdate() }
            .store(in: &cancellables)

        usageService.$error
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in self?.updateStatusItemAppearance() }
            .store(in: &cancellables)

        settingsManager.$settings
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in self?.settingsDidChange() }
            .store(in: &cancellables)

        // Close popover when clicking outside
        NotificationCenter.default.addObserver(
            self, selector: #selector(closePopover),
            name: NSPopover.didCloseNotification, object: popover
        )
    }

    func applicationWillTerminate(_ notification: Notification) {
        usageService.stopPolling()
    }

    // MARK: - Setup

    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "chart.pie", accessibilityDescription: "Claude Usage")
            button.action = #selector(togglePopover)
            button.target = self
        }
    }

    private func setupPopover() {
        popover = NSPopover()
        popover.contentSize = NSSize(width: 280, height: 300)
        popover.behavior = .transient
        popover.contentViewController = NSHostingController(
            rootView: MenuBarView(usageService: usageService, settingsManager: settingsManager)
        )
    }

    private func setupNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    private func startUsagePolling() {
        usageService.startPolling()

        // Periodic notification check
        Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            self?.checkForNotifications()
        }
    }

    // MARK: - Popover

    @objc private func togglePopover() {
        if popover.isShown {
            closePopover()
        } else {
            showPopover()
        }
    }

    private func showPopover() {
        if let button = statusItem.button {
            popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            NSApp.activate(ignoringOtherApps: true)
        }
    }

    @objc private func closePopover() {
        popover.performClose(nil)
    }

    // MARK: - Updates

    private func settingsDidChange() {
        updateStatusItemAppearance()
    }

    private func usageDidUpdate() {
        updateStatusItemAppearance()
        checkForNotifications()
    }

    private func updateStatusItemAppearance() {
        guard let button = statusItem.button else { return }

        let usage = usageService.currentUsage

        // Show error indicator if there's an error
        if usageService.error != nil {
            let attrs: [NSAttributedString.Key: Any] = [
                .font: NSFont.monospacedSystemFont(ofSize: 12, weight: .medium),
                .foregroundColor: NSColor.systemOrange
            ]
            button.attributedTitle = NSAttributedString(string: "\u{26A0}", attributes: attrs)
            return
        }

        if settingsManager.settings.compactDisplay {
            let fiveHr = usage.fiveHourUtilization
            let sevenDay = usage.sevenDayUtilization

            let fiveHrColor = usageColor(for: fiveHr)
            let sevenDayColor = usageColor(for: sevenDay)

            let text = NSMutableAttributedString()
            let font = NSFont.monospacedSystemFont(ofSize: 12, weight: .medium)

            text.append(NSAttributedString(
                string: "\(fiveHr)%",
                attributes: [.font: font, .foregroundColor: fiveHrColor]
            ))
            text.append(NSAttributedString(
                string: " \u{00B7} ",
                attributes: [.font: font, .foregroundColor: NSColor.secondaryLabelColor]
            ))
            text.append(NSAttributedString(
                string: "\(sevenDay)%",
                attributes: [.font: font, .foregroundColor: sevenDayColor]
            ))

            button.attributedTitle = text
            button.image = nil
        } else {
            button.image = NSImage(systemSymbolName: "chart.pie", accessibilityDescription: "Claude Usage")
            button.title = "\(usage.sevenDayUtilization)%"
        }
    }

    private func usageColor(for percentage: Int) -> NSColor {
        let critical = settingsManager.settings.criticalThreshold
        let warning = settingsManager.settings.warningThreshold
        if Double(percentage) >= critical { return .systemRed }
        if Double(percentage) >= warning { return .systemOrange }
        return .labelColor
    }

    // MARK: - Notifications

    private func checkForNotifications() {
        guard settingsManager.settings.notificationsEnabled else { return }

        let usage = usageService.currentUsage.fiveHourUtilization
        let warning = Int(settingsManager.settings.warningThreshold)
        let critical = Int(settingsManager.settings.criticalThreshold)

        if usage >= critical && lastCriticalNotified < critical {
            sendNotification(
                title: "Claude Usage Critical",
                body: "5hr usage at \(usage)% \u{2014} approaching limit",
                critical: true
            )
            lastCriticalNotified = usage
        } else if usage >= warning && lastWarningNotified < warning {
            sendNotification(
                title: "Claude Usage Warning",
                body: "5hr usage at \(usage)%",
                critical: false
            )
            lastWarningNotified = usage
        }

        // Reset notification tracking when usage drops
        if usage < warning {
            lastWarningNotified = 0
            lastCriticalNotified = 0
        }
    }

    private func sendNotification(title: String, body: String, critical: Bool) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = critical ? .defaultCritical : .default

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )
        UNUserNotificationCenter.current().add(request)
    }
}
