// swift-tools-version: 5.10

import PackageDescription

let package = Package(
    name: "BoltEverythingUI",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "BoltEverythingUI",
            targets: ["BoltEverythingUI"]
        )
    ],
    targets: [
        .target(
            name: "BoltEverythingUI"
        ),
        .testTarget(
            name: "BoltEverythingUITests",
            dependencies: ["BoltEverythingUI"]
        )
    ]
)
